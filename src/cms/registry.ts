// Source of truth for every editable piece of content on the site.
//
// Each entry declares one CMS key. When you add a <Content id="..." /> to the
// codebase, also add its entry here. Run `npm run cms:sync` to push changes to
// the backend — it's idempotent and never clobbers admin edits.
//
// Keys use dot notation: <page>.<section>.<element>
//   home.hero.title
//   landing.cta.primary
//   navbar.link.explore

import type { ContentStyles, ContentType } from '@/services/content';

export interface CmsRegistryEntry {
  key: string;
  page: string;
  section?: string;
  contentType?: ContentType;
  defaultContent?: string;
  defaultStyles?: ContentStyles;
  description?: string;
}

export const cmsRegistry: CmsRegistryEntry[] = [
  // Registry entries are added as each page is refactored. See the sub-files
  // under src/cms/pages/*.ts for per-page groupings.
];

// Per-page registry files — import and spread into the master array below so
// each page keeps its own contained entry list.
import { landingEntries } from './pages/landing';
import { homeEntries } from './pages/home';
import { aboutEntries } from './pages/about';
import { contactEntries } from './pages/contact';
import { resourcesEntries } from './pages/resources';
import { chromeEntries } from './pages/chrome';

cmsRegistry.push(
  ...landingEntries,
  ...homeEntries,
  ...aboutEntries,
  ...contactEntries,
  ...resourcesEntries,
  ...chromeEntries,
);
