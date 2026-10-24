// Apply a hand-written SQL file to the database (DIRECT_URL, else
// DATABASE_URL) in one transaction, then print the RLS state of `public`.
// Prisma sends one statement per call, so the file is split on top-level `;`
// (quotes, comments and $$ bodies kept whole) and its own BEGIN/COMMIT dropped.
//
//   cd apps/api && node --env-file=.env scripts/apply-sql.cjs ../../docs/sql/<file>.sql
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('usage: node --env-file=.env scripts/apply-sql.cjs <file.sql>');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

function splitStatements(sql) {
  const out = [];
  let cur = '';
  let i = 0;
  while (i < sql.length) {
    const rest = sql.slice(i);
    const dollar = rest.match(/^\$[A-Za-z_]*\$/);
    if (dollar) {
      const end = sql.indexOf(dollar[0], i + dollar[0].length);
      if (end < 0) throw new Error(`unterminated ${dollar[0]} quote`);
      cur += sql.slice(i, end + dollar[0].length);
      i = end + dollar[0].length;
    } else if (rest.startsWith('--')) {
      const nl = sql.indexOf('\n', i);
      i = nl < 0 ? sql.length : nl;
    } else if (sql[i] === "'" || sql[i] === '"') {
      let j = i + 1;
      while (j < sql.length && !(sql[j] === sql[i] && sql[j + 1] !== sql[i])) j += sql[j] === sql[i] ? 2 : 1;
      cur += sql.slice(i, j + 1);
      i = j + 1;
    } else if (sql[i] === ';') {
      out.push(cur.trim());
      cur = '';
      i++;
    } else {
      cur += sql[i++];
    }
  }
  out.push(cur.trim());
  return out.filter((s) => s && !/^(BEGIN|COMMIT)$/i.test(s));
}

(async () => {
  const statements = splitStatements(fs.readFileSync(file, 'utf8'));
  await prisma.$transaction(async (tx) => {
    for (const st of statements) await tx.$executeRawUnsafe(st);
  });
  console.log(`Applied ${file} (${statements.length} statements)`);
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
