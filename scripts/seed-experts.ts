/**
 * Seed Expert Data — Imports fictional expert directory entries
 * from seed/experts.json
 *
 * Usage: pnpm seed:experts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ExpertSeedEntry {
  name: string;
  email: string | null;
  title: string;
  organization: string | null;
  country: string; // ISO3 code
  specializations: string[];
  languages: string[];
  bio: string | null;
  verified: boolean;
}

async function main() {
  console.log('👨‍🔬 Seeding expert directory...');

  const seedPath = path.resolve(__dirname, '../seed/experts.json');
  const experts: ExpertSeedEntry[] = JSON.parse(
    fs.readFileSync(seedPath, 'utf-8'),
  );

  // Build country lookup by ISO3
  const countries = await prisma.country.findMany({
    select: { id: true, isoCode3: true, name: true },
  });
  const countryMap = new Map(countries.map((c) => [c.isoCode3, c]));

  let created = 0;
  let skipped = 0;

  for (const entry of experts) {
    const country = countryMap.get(entry.country);
    if (!country) {
      console.warn(`  ⚠️  Country not found: ${entry.country} — skipping`);
      skipped++;
      continue;
    }

    // Use email as unique key for upsert
    if (entry.email) {
      await prisma.expert.upsert({
        where: { email: entry.email },
        update: {
          name: entry.name,
          title: entry.title,
          organization: entry.organization,
          countryId: country.id,
          specializations: entry.specializations,
          languages: entry.languages,
          bio: entry.bio,
          verified: entry.verified,
        },
        create: {
          name: entry.name,
          email: entry.email,
          title: entry.title,
          organization: entry.organization,
          countryId: country.id,
          specializations: entry.specializations,
          languages: entry.languages,
          bio: entry.bio,
          verified: entry.verified,
        },
      });
    } else {
      await prisma.expert.create({
        data: {
          name: entry.name,
          title: entry.title,
          organization: entry.organization,
          countryId: country.id,
          specializations: entry.specializations,
          languages: entry.languages,
          bio: entry.bio,
          verified: entry.verified,
        },
      });
    }

    created++;
    console.log(`  ✅ ${entry.name} — ${entry.title}`);
  }

  console.log(`\n👨‍🔬 Expert seeding complete: ${created} created, ${skipped} skipped`);
}

main()
  .catch((e) => {
    console.error('❌ Expert seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
