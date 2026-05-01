/**
 * Reconstruct an UploadAudit history from rows that already exist in
 * IndicatorValue, CountryPolicy, and Document. The actual contributor /
 * timestamps for past commits are lost (those used to live in an in-memory
 * jobStore), but we can derive a reasonable approximation:
 *
 *   - AYIMS_TEMPLATE  → group IndicatorValue by (countryId, source, ageGroup)
 *                       where source contains "AYIMS"; one row per group.
 *   - GENERIC_DATA    → group remaining IndicatorValue by source; one row per
 *                       distinct source that's not AYIMS-y.
 *   - POLICIES_DATABASE → one row per distinct CountryPolicy.policyName-style
 *                       source (we only track this loosely).
 *   - DOCUMENT        → one row per Document, linked back via documentId.
 *
 * Idempotent: skips inserting an audit row if one already exists for the
 * same (kind, fileName, source) signature. Safe to re-run.
 *
 * Usage:  pnpm tsx scripts/backfill-upload-audits.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  let inserted = 0;
  let skipped = 0;

  // ── 1. AYIMS template uploads ───────────────────────────────────────────
  // One audit row per (country, source) where source mentions AYIMS.
  console.log('Backfilling AYIMS audit rows...');
  const ayims = await prisma.indicatorValue.groupBy({
    by: ['countryId', 'source'],
    where: { source: { contains: 'AYIMS', mode: 'insensitive' } },
    _count: { id: true },
    _min: { createdAt: true },
    _max: { createdAt: true },
  });
  for (const g of ayims) {
    const country = await prisma.country.findUnique({
      where: { id: g.countryId },
      select: { id: true, name: true },
    });
    if (!country) continue;
    const fileName = `${country.name}_AYIMS_Template_v1.xlsx (backfill)`;
    const exists = await prisma.uploadAudit.findFirst({
      where: { kind: 'AYIMS_TEMPLATE', fileName, source: g.source },
    });
    if (exists) { skipped++; continue; }
    await prisma.uploadAudit.create({
      data: {
        kind: 'AYIMS_TEMPLATE',
        fileName,
        fileSize: 0,
        status: 'SUCCESS',
        rowsAffected: g._count.id,
        countryId: g.countryId,
        source: g.source,
        notes: '(backfilled — original upload pre-dates the audit log)',
        uploadedAt: g._min.createdAt ?? new Date(),
        durationMs: null,
      },
    });
    inserted++;
  }

  // ── 2. Generic data (non-AYIMS sources) ────────────────────────────────
  console.log('Backfilling generic-data audit rows...');
  const generic = await prisma.indicatorValue.groupBy({
    by: ['source'],
    where: {
      NOT: {
        OR: [
          { source: { contains: 'AYIMS', mode: 'insensitive' } },
          { source: { contains: 'Sample Data' } },
        ],
      },
    },
    _count: { id: true },
    _min: { createdAt: true },
  });
  for (const g of generic) {
    const fileName = `${g.source} (bulk import, backfill)`;
    const exists = await prisma.uploadAudit.findFirst({
      where: { kind: 'GENERIC_DATA', fileName },
    });
    if (exists) { skipped++; continue; }
    await prisma.uploadAudit.create({
      data: {
        kind: 'GENERIC_DATA',
        fileName,
        fileSize: 0,
        status: 'SUCCESS',
        rowsAffected: g._count.id,
        source: g.source,
        notes: '(backfilled — original upload pre-dates the audit log)',
        uploadedAt: g._min.createdAt ?? new Date(),
      },
    });
    inserted++;
  }

  // ── 3. Documents ───────────────────────────────────────────────────────
  console.log('Backfilling document audit rows...');
  const docs = await prisma.document.findMany({
    select: { id: true, originalFilename: true, fileSize: true, source: true,
              countryId: true, uploadedById: true, createdAt: true },
  });
  for (const d of docs) {
    const exists = await prisma.uploadAudit.findFirst({
      where: { kind: 'DOCUMENT', documentId: d.id },
    });
    if (exists) { skipped++; continue; }
    await prisma.uploadAudit.create({
      data: {
        kind: 'DOCUMENT',
        fileName: d.originalFilename,
        fileSize: d.fileSize,
        status: 'SUCCESS',
        rowsAffected: 1,
        countryId: d.countryId,
        documentId: d.id,
        source: d.source,
        uploadedById: d.uploadedById,
        uploadedAt: d.createdAt,
      },
    });
    inserted++;
  }

  // ── 4. Policy database commits ─────────────────────────────────────────
  // We only have one row in CountryPolicy per (country × policyType) — so we
  // group by createdAt-day to approximate distinct upload events.
  console.log('Backfilling policy-database audit rows...');
  const policyRows = await prisma.countryPolicy.findMany({
    select: { id: true },
  });
  if (policyRows.length > 0) {
    const exists = await prisma.uploadAudit.findFirst({
      where: { kind: 'POLICIES_DATABASE' },
    });
    if (!exists) {
      await prisma.uploadAudit.create({
        data: {
          kind: 'POLICIES_DATABASE',
          fileName: 'African_National_Youth_Policies_Database (backfill)',
          fileSize: 0,
          status: 'SUCCESS',
          rowsAffected: policyRows.length,
          source: 'African National Youth Policies Database (PACSDA)',
          notes: '(backfilled — original upload pre-dates the audit log)',
        },
      });
      inserted++;
    } else {
      skipped++;
    }
  }

  console.log(`\nBackfill complete. ${inserted} rows inserted, ${skipped} already present.`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
