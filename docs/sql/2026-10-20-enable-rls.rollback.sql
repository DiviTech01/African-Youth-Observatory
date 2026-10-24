-- Rollback for 2026-10-20-enable-rls.sql: back to the state before it ran
-- (RLS only on "User", anon/authenticated holding every table privilege).
-- This reopens the public schema to the anon key; use only to undo a breakage.

BEGIN;

DROP TRIGGER IF EXISTS guard_user_privileged_columns ON public."User";
DROP FUNCTION IF EXISTS public.guard_user_privileged_columns();

GRANT TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public TO anon, authenticated;

DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND c.relname <> 'User'
  LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

COMMIT;
