/**
 * Push the local CMS registry (src/cms/registry.ts) to the backend.
 *
 * Usage:
 *   API_URL=http://localhost:3001/api  AYD_ADMIN_TOKEN=xxx  npm run cms:sync
 *
 * The backend's POST /content/sync-registry is idempotent: new keys are
 * created, existing keys get their metadata updated, but saved admin edits
 * (draft/published content and styles) are never touched.
 */

import { cmsRegistry } from '../src/cms/registry';

const API_URL = process.env.API_URL ?? 'http://localhost:3001/api';
const TOKEN = process.env.AYD_ADMIN_TOKEN;

async function main() {
  if (!TOKEN) {
    console.error('AYD_ADMIN_TOKEN env var is required (JWT from an ADMIN user).');
    process.exit(1);
  }
  if (cmsRegistry.length === 0) {
    console.log('Registry is empty — nothing to sync.');
    return;
  }

  console.log(`Syncing ${cmsRegistry.length} entries to ${API_URL}…`);

  const res = await fetch(`${API_URL}/content/sync-registry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ entries: cmsRegistry }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`HTTP ${res.status}: ${body}`);
    process.exit(1);
  }

  const result = await res.json();
  console.log(`✔ Created ${result.created}, updated ${result.updated}, total ${result.total}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
