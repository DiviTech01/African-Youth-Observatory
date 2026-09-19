#!/usr/bin/env node
/**
 * Writes public/sitemap.xml before the Vite build copies public/ into dist/.
 *
 * `sitemap.xml` was referenced as though it existed but never did: because the
 * SPA serves index.html for every unmatched path, the URL returned HTTP 200 with
 * an HTML shell, so a crawler saw a malformed sitemap rather than a 404 and
 * robots.txt had no Sitemap: line to point at one anyway.
 *
 * Only routes worth indexing are listed — public pages and the data tools that
 * work without an account. Auth screens, the admin area, settings and
 * per-user pages are deliberately absent.
 */
import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.SITE_URL?.replace(/\/+$/, '') || 'https://africanyouthobservatory.org';

/** `changefreq`/`priority` are hints; crawlers may ignore them. */
const ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'yearly', priority: '0.4' },

  // Data tools — open to everyone, no account required.
  { path: '/dashboard', changefreq: 'weekly', priority: '0.9' },
  { path: '/explore', changefreq: 'weekly', priority: '0.9' },
  { path: '/compare', changefreq: 'weekly', priority: '0.8' },
  { path: '/countries', changefreq: 'weekly', priority: '0.9' },
  { path: '/themes', changefreq: 'weekly', priority: '0.8' },
  { path: '/youth-index', changefreq: 'weekly', priority: '0.9' },
  { path: '/insights', changefreq: 'weekly', priority: '0.7' },
  { path: '/policy-monitor', changefreq: 'monthly', priority: '0.7' },
  { path: '/ask', changefreq: 'monthly', priority: '0.7' },

  // Reference material.
  { path: '/resources/methodology', changefreq: 'monthly', priority: '0.6' },
  { path: '/resources/glossary', changefreq: 'monthly', priority: '0.5' },
  { path: '/resources/faq', changefreq: 'monthly', priority: '0.5' },
  { path: '/resources/toolkits', changefreq: 'monthly', priority: '0.5' },

  // Legal. Low priority to a reader, but app-store reviewers and crawlers both
  // need to find these, so they are listed explicitly.
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/data-licensing', changefreq: 'yearly', priority: '0.3' },
  { path: '/cookies', changefreq: 'yearly', priority: '0.3' },
];

const today = new Date().toISOString().slice(0, 10);

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...ROUTES.map(({ path, changefreq, priority }) =>
    [
      '  <url>',
      `    <loc>${BASE}${path}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      '  </url>',
    ].join('\n'),
  ),
  '</urlset>',
  '',
].join('\n');

await writeFile(join(ROOT, 'public', 'sitemap.xml'), xml, 'utf8');
console.log(`sitemap: ${ROUTES.length} URLs written for ${BASE}`);
