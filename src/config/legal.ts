// Single source of truth for the app's legal-document links and the contact
// points those documents publish.
//
// These are in-app routes (see App.tsx), not external URLs. They were absolute
// URLs to paths that had no route, so every footer link rendered "Page not
// found" — which also blocked Google Play, since a reachable privacy-policy URL
// is a publishing requirement, and GDPR Art. 13 requires one for EU visitors.
//
// Each can still be overridden at build time with the matching VITE_* env var,
// for the case where legal review wants the canonical copy hosted elsewhere.

export const LEGAL_LINKS = {
  privacy: import.meta.env.VITE_PRIVACY_URL ?? '/privacy',
  terms: import.meta.env.VITE_TERMS_URL ?? '/terms',
  dataLicensing: import.meta.env.VITE_DATA_LICENSING_URL ?? '/data-licensing',
  cookies: import.meta.env.VITE_COOKIE_POLICY_URL ?? '/cookies',
} as const;

export type LegalLinkKey = keyof typeof LEGAL_LINKS;

/** True when the link is an in-app route and should render as a <Link>. */
export const isInternalLegalLink = (href: string): boolean => href.startsWith('/');

/**
 * Addresses the legal documents publish. These must be mailboxes that are
 * actually monitored: a privacy contact that bounces is itself a GDPR failure,
 * and Play reviewers do check that the policy names a way to reach the operator.
 */
export const LEGAL_CONTACT = {
  general: 'info@africanyouthobservatory.org',
  privacy: 'privacy@africanyouthobservatory.org',
  data: 'data@africanyouthobservatory.org',
  operator: 'African Youth Observatory (AYO), a PACSDA initiative',
} as const;

/**
 * The date shown on every legal page. Bump it in the same commit as any
 * substantive change to the documents — users are entitled to know when the
 * terms they agreed to last moved.
 */
export const LEGAL_LAST_UPDATED = '2026-09-19';
