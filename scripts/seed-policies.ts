/**
 * Seed Policy Data — Imports AYC ratification and national youth policy data
 * for all 54 African countries from seed/policies.json
 *
 * Usage: pnpm seed:policies
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface PolicySeedEntry {
  country: string; // ISO3 code
  policyName: string;
  policyType: string;
  yearAdopted: number | null;
  yearRevised: number | null;
  aycRatified: boolean;
  aycRatifiedYear: number | null;
  // AfCFTA Women & Youth Protocol status; omit (or UNKNOWN) unless sourced.
  afcftaProtocolStatus?: 'UNKNOWN' | 'NOT_SIGNED' | 'SIGNED' | 'RATIFIED';
  afcftaProtocolSourceUrl?: string | null;
  status: string;
}

async function main() {
  console.log('📜 Seeding policy data...');

  const seedPath = path.resolve(__dirname, '../seed/policies.json');
  const policies: PolicySeedEntry[] = JSON.parse(
    fs.readFileSync(seedPath, 'utf-8'),
  );

  // Build country lookup by ISO3
  const countries = await prisma.country.findMany({
    select: { id: true, isoCode3: true, name: true },
  });
  const countryMap = new Map(countries.map((c) => [c.isoCode3, c]));

  let created = 0;
  let skipped = 0;

  for (const entry of policies) {
    const country = countryMap.get(entry.country);
    if (!country) {
      console.warn(`  ⚠️  Country not found: ${entry.country} — skipping`);
      skipped++;
      continue;
    }

    await prisma.countryPolicy.upsert({
      where: {
        id: `policy-${entry.country.toLowerCase()}`,
      },
      update: {
        policyName: entry.policyName,
        policyType: entry.policyType,
        yearAdopted: entry.yearAdopted,
        yearRevised: entry.yearRevised,
        aycRatified: entry.aycRatified,
        aycRatifiedYear: entry.aycRatifiedYear,
        // afcftaProtocol* is deliberately not overwritten on update so a
        // re-seed never clobbers statuses an admin has entered.
        status: entry.status,
      },
      create: {
        id: `policy-${entry.country.toLowerCase()}`,
        countryId: country.id,
        policyName: entry.policyName,
        policyType: entry.policyType,
        yearAdopted: entry.yearAdopted,
        yearRevised: entry.yearRevised,
        aycRatified: entry.aycRatified,
        aycRatifiedYear: entry.aycRatifiedYear,
        afcftaProtocolStatus: entry.afcftaProtocolStatus ?? 'UNKNOWN',
        afcftaProtocolSourceUrl: entry.afcftaProtocolSourceUrl ?? null,
        status: entry.status,
      },
    });

    created++;
    console.log(`  ✅ ${country.name} — ${entry.policyName}`);
  }

  console.log(`\n📜 Policy seeding complete: ${created} created, ${skipped} skipped`);
}

main()
  .catch((e) => {
    console.error('❌ Policy seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
