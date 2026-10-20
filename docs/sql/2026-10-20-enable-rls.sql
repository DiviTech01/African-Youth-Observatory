-- 2026-10-20: lock the public schema down to the API.
--
-- The browser ships the Supabase anon key, so every table in `public` was
-- readable and writable by anyone through PostgREST (subscriber emails, push
-- tokens, CMS drafts, indicator values...). Only "User" had RLS. The API talks
-- to Postgres through Prisma as `postgres` (BYPASSRLS, table owner), so
-- enabling RLS with no policies changes nothing for it; the only direct client
-- access is supabase-js on "User" (AuthContext, Settings, Admin), whose
-- existing policies are kept.
--
-- New tables created by `prisma db push` come with RLS OFF and anon grants:
-- re-run the ENABLE block (it is idempotent) after any schema change.
-- Rollback: 2026-10-20-enable-rls.rollback.sql

BEGIN;

DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- TRUNCATE ignores RLS entirely, and nothing client-side needs TRIGGER or
-- REFERENCES.
REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- "Users can update own profile" has no column restriction, so any signed-in
-- user could set their own role to ADMIN from the browser. Only an admin (the
-- Admin page's role editor) or the server may change role, id or email.
CREATE OR REPLACE FUNCTION public.guard_user_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.jwt() is NULL for Prisma's direct connection and 'service_role' for
  -- the server key, so only browser (PostgREST) requests are checked.
  IF (NEW.role IS DISTINCT FROM OLD.role
      OR NEW.id IS DISTINCT FROM OLD.id
      OR NEW.email IS DISTINCT FROM OLD.email)
     AND coalesce(auth.jwt() ->> 'role', '') IN ('anon', 'authenticated')
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only an administrator can change role, id or email'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_user_privileged_columns ON public."User";
CREATE TRIGGER guard_user_privileged_columns
  BEFORE UPDATE ON public."User"
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_privileged_columns();

COMMIT;
