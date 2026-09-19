#!/usr/bin/env node
/**
 * Copies every non-TypeScript asset from src/ into dist/, preserving paths.
 *
 * `nest build` is already configured to do this (`assets` in nest-cli.json), but
 * it copies asynchronously and can exit before the copies land. The result is a
 * build that compiles clean and then dies at startup with
 * `Cannot find module './ayims-template-mapping.json'` — observed locally more
 * than once, and on Render it would be an intermittently broken deploy that a
 * rebuild "fixes" without explaining anything.
 *
 * Running this after `nest build` makes the step deterministic. It is idempotent,
 * so it costs nothing when the nest copy did happen to win the race.
 */
import { readdir, mkdir, copyFile, stat } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(apiRoot, 'src');
const DIST = join(apiRoot, 'dist');

/** Extensions that belong in the build output but are not compiled. */
const ASSET_EXTENSIONS = ['.json', '.hbs', '.html', '.csv', '.xlsx'];

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (ASSET_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) yield full;
  }
}

async function main() {
  try {
    await stat(DIST);
  } catch {
    console.error('copy-assets: dist/ does not exist — run `nest build` first.');
    process.exit(1);
  }

  let copied = 0;
  for await (const file of walk(SRC)) {
    const target = join(DIST, relative(SRC, file));
    await mkdir(dirname(target), { recursive: true });
    await copyFile(file, target);
    copied++;
  }
  console.log(`copy-assets: ${copied} asset(s) in dist/`);
}

main().catch((err) => {
  console.error(`copy-assets failed: ${err.message}`);
  process.exit(1);
});
