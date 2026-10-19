/**
 * Rename the sample expert rows in place.
 *
 * The directory was seeded with 28 placeholder rows named "Dr. Expert N" at
 * "<Country> Youth Research Institute". This replaces their name, email,
 * title, organisation, languages and bio with the fictional profiles in
 * apps/api/src/modules/expert-directory/sample-experts.ts. IDs, countries
 * and specializations are kept; rows are matched by id and the country is
 * checked before anything is written.
 *
 * Safe to re-run:
 *   - the first run writes a full JSON backup of every Expert row; later runs
 *     never overwrite an existing backup
 *   - rows that already match are skipped
 *   - rows that are missing, or whose country no longer matches, are skipped
 *
 * Usage:
 *   pnpm tsx scripts/rename-sample-experts.ts               # back up + rename
 *   pnpm tsx scripts/rename-sample-experts.ts --dry-run     # show the plan only
 *   pnpm tsx scripts/rename-sample-experts.ts --write-json  # regenerate seed/experts.json
 *   pnpm tsx scripts/rename-sample-experts.ts --restore     # put the backed-up values back
 *   --backup <path>  overrides the backup file location
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { SAMPLE_EXPERTS } from '../apps/api/src/modules/expert-directory/sample-experts';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const backupIdx = args.indexOf('--backup');
const BACKUP_PATH =
  backupIdx >= 0 && args[backupIdx + 1]
    ? path.resolve(args[backupIdx + 1])
    : path.resolve(__dirname, '../../audit-2026-10/experts-before-rename.json');

const prisma = new PrismaClient();

// The fields this script owns. Everything else on the row is left alone.
const FIELDS = ['name', 'email', 'title', 'organization', 'languages', 'bio'] as const;

function sameValue(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function writeSeedJson() {
  const out = SAMPLE_EXPERTS.map((e) => ({
    id: e.id,
    name: e.name,
    email: e.email,
    title: e.title,
    organization: e.organization,
    country: e.country,
    specializations: e.specializations,
    languages: e.languages,
    bio: e.bio,
    verified: true,
  }));
  const target = path.resolve(__dirname, '../seed/experts.json');
  fs.writeFileSync(target, JSON.stringify(out, null, 2) + '\n', 'utf-8');
  console.log(`Wrote ${out.length} experts to ${target}`);
}

async function backup() {
  if (fs.existsSync(BACKUP_PATH)) {
    console.log(`Backup already exists, leaving it untouched: ${BACKUP_PATH}`);
    return;
  }
  const rows = await prisma.expert.findMany({
    include: { country: { select: { isoCode3: true, name: true } } },
    orderBy: { id: 'asc' },
  });
  fs.mkdirSync(path.dirname(BACKUP_PATH), { recursive: true });
  fs.writeFileSync(
    BACKUP_PATH,
    JSON.stringify({ takenAt: new Date().toISOString(), count: rows.length, rows }, null, 2),
    'utf-8',
  );
  console.log(`Backed up ${rows.length} expert rows to ${BACKUP_PATH}`);
}

async function rename() {
  await backup();

  const ids = SAMPLE_EXPERTS.map((e) => e.id);
  const rows = await prisma.expert.findMany({
    where: { id: { in: ids } },
    include: { country: { select: { isoCode3: true } } },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));

  let updated = 0;
  let unchanged = 0;
  let skipped = 0;

  for (const sample of SAMPLE_EXPERTS) {
    const row = byId.get(sample.id);
    if (!row) {
      console.warn(`  skip ${sample.id}: row not found`);
      skipped++;
      continue;
    }
    if (row.country.isoCode3 !== sample.country) {
      console.warn(`  skip ${sample.id}: country is ${row.country.isoCode3}, expected ${sample.country}`);
      skipped++;
      continue;
    }

    const data: Record<string, unknown> = {};
    for (const f of FIELDS) {
      if (!sameValue(row[f], sample[f])) data[f] = sample[f];
    }
    // A verified row stuck in PENDING would never surface correctly in admin;
    // align the status with the verified flag rather than the other way round.
    if (row.verified && row.status !== 'APPROVED') data.status = 'APPROVED';

    if (Object.keys(data).length === 0) {
      unchanged++;
      continue;
    }

    if (data.email) {
      const clash = await prisma.expert.findUnique({ where: { email: sample.email } });
      if (clash && clash.id !== row.id) {
        console.warn(`  skip ${sample.id}: email ${sample.email} already used by ${clash.id}`);
        skipped++;
        continue;
      }
    }

    console.log(`  ${DRY_RUN ? 'would rename' : 'rename'} ${row.id}: "${row.name}" -> "${sample.name}"`);
    if (!DRY_RUN) {
      await prisma.expert.update({ where: { id: row.id }, data });
    }
    updated++;
  }

  console.log(
    `\n${DRY_RUN ? '[dry run] ' : ''}${updated} ${DRY_RUN ? 'to update' : 'updated'}, ${unchanged} already current, ${skipped} skipped`,
  );
}

async function restore() {
  if (!fs.existsSync(BACKUP_PATH)) {
    throw new Error(`No backup at ${BACKUP_PATH}`);
  }
  const { rows } = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf-8'));
  let restored = 0;
  for (const r of rows) {
    const data = {
      name: r.name,
      email: r.email,
      title: r.title,
      organization: r.organization,
      languages: r.languages,
      bio: r.bio,
      status: r.status,
    };
    console.log(`  ${DRY_RUN ? 'would restore' : 'restore'} ${r.id} -> "${r.name}"`);
    if (!DRY_RUN) await prisma.expert.update({ where: { id: r.id }, data });
    restored++;
  }
  console.log(`\n${DRY_RUN ? '[dry run] ' : ''}${restored} rows restored from backup`);
}

async function main() {
  if (args.includes('--write-json')) return writeSeedJson();
  if (args.includes('--restore')) return restore();
  return rename();
}

main()
  .catch((e) => {
    console.error('Rename failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
