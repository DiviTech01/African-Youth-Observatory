#!/usr/bin/env node
/**
 * Generates the Prisma client into the @prisma/client that apps/api compiles
 * and runs against.
 *
 * `prisma generate` picks its output by resolving @prisma/client upward from
 * the schema file. The schema lives in packages/database/prisma, so a plain
 * `npx prisma generate` (even run from apps/api) writes the root workspace's
 * client and leaves apps/api/node_modules with a stale one. Every schema change
 * since 2026-10-19 (AfCFTA columns, PushToken, AiSpendDay) then failed the
 * Render build with "Property 'afcftaProtocolStatus' does not exist", and
 * locally it is the "sync the client into the pnpm store" chore.
 *
 * Copying the schema under apps/api first makes Prisma resolve apps/api's own
 * @prisma/client, wherever the package manager put it.
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(apiRoot, '..', '..', 'packages', 'database', 'prisma', 'schema.prisma');
// Relative to apiRoot (the cwd below): Windows needs a shell for npx, and the
// shell would split an absolute path at the spaces in it.
const targetRel = 'prisma/.generated/schema.prisma';
const target = join(apiRoot, targetRel);

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
execFileSync('npx', ['prisma', 'generate', '--schema', targetRel], {
  cwd: apiRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
