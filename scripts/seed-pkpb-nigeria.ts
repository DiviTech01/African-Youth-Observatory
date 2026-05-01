/**
 * Seed the Nigeria PKPB report record.
 *
 * Uploads `public/reports/Nigeria.html` to R2 and creates a Document(type=PKPB_REPORT)
 * pointing at it, so the /pkpb/nigeria page has a real record + a working
 * "Download Report Card" button out of the gate. Subsequent contributor
 * uploads through the UI replace this as the latest PKPB report.
 *
 * Usage:
 *   pnpm tsx scripts/seed-pkpb-nigeria.ts
 *
 * Requires R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 * in env. Skips R2 upload (creates DRAFT document) if R2 is not configured.
 */

import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🇳🇬 Seeding Nigeria PKPB document...');

  const country = await prisma.country.findFirst({ where: { isoCode3: 'NGA' } });
  if (!country) {
    console.error('  ✖ Nigeria not found in countries table — run db:seed first.');
    process.exit(1);
  }

  const filePath = path.resolve(__dirname, '..', 'public', 'reports', 'Nigeria.html');
  if (!fs.existsSync(filePath)) {
    console.error(`  ✖ Source file not found: ${filePath}`);
    process.exit(1);
  }
  const buffer = fs.readFileSync(filePath);

  const r2 = makeR2Client();
  let storageKey: string;
  let status: 'PUBLISHED' | 'DRAFT' = 'DRAFT';

  if (r2) {
    storageKey = `documents/pkpb/${country.id}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.html`;
    await r2.client.send(
      new PutObjectCommand({
        Bucket: r2.bucket,
        Key: storageKey,
        Body: buffer,
        ContentType: 'text/html',
        CacheControl: 'private, no-cache',
      }),
    );
    status = 'PUBLISHED';
    console.log(`  ✓ Uploaded to R2: ${storageKey}`);
  } else {
    storageKey = `documents/pkpb/${country.id}/seed-placeholder/${randomUUID()}.html`;
    console.log('  ⚠ R2 not configured — creating DRAFT record with placeholder key.');
  }

  // Replace any existing Nigeria PKPB seed document so re-runs are idempotent.
  await prisma.document.deleteMany({
    where: { countryId: country.id, type: 'PKPB_REPORT', source: 'PACSDA (seed)' },
  });

  const doc = await prisma.document.create({
    data: {
      type: 'PKPB_REPORT',
      title: 'Promise Kept · Promise Broken — Nigeria 2025',
      description:
        'PACSDA forensic audit of Nigeria\'s commitments to its young citizens — evaluated against outcomes. AYEMI Score: 33% (Critical). Edition: Dec 2025 · Vol 01.',
      countryId: country.id,
      originalFilename: 'Promise_Kept_Promise_Broken_Nigeria_2025.html',
      mimeType: 'text/html',
      fileSize: buffer.length,
      storageKey,
      source: 'PACSDA (seed)',
      edition: 'Dec 2025 · Vol 01',
      year: 2025,
      status,
      // The hardcoded Nigeria data in src/data/countryReports.ts already populates
      // the report card; omitting extractedSummary lets the local fallback win.
    },
  });

  console.log(`  ✓ Document created: ${doc.id} (${doc.status})`);
  console.log('  → /pkpb/nigeria now serves this record.');
}

interface R2Client {
  client: S3Client;
  bucket: string;
}

function makeR2Client(): R2Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return { client, bucket };
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
