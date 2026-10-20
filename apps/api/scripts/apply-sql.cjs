// Apply a hand-written SQL file (one transaction, BEGIN/COMMIT inside the file)
// to the database in DATABASE_URL, then print the RLS state of `public`.
//
//   cd apps/api && node --env-file=.env scripts/apply-sql.cjs ../../docs/sql/<file>.sql
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('usage: node --env-file=.env scripts/apply-sql.cjs <file.sql>');
  process.exit(1);
}

const prisma = new PrismaClient();

(async () => {
  await prisma.$executeRawUnsafe(fs.readFileSync(file, 'utf8'));
  console.log(`Applied ${file}`);
  const rows = await prisma.$queryRawUnsafe(`
    SELECT c.relname AS "table", c.relrowsecurity AS rls,
           (SELECT count(*)::int FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS policies
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY 1`);
  console.table(rows);
  const off = rows.filter((r) => !r.rls).length;
  console.log(off ? `WARNING: ${off} table(s) still have RLS off` : 'RLS is on for every public table.');
})()
  .catch((e) => {
    console.error('FAILED (nothing was committed):', e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
