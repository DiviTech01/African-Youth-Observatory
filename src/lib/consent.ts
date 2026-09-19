/**
 * The visitor's answer to the cookie banner, and the one place anything that is
 * not strictly necessary must ask before it runs.
 *
 * The banner used to write 'accepted' or 'managed' and nothing ever read the
 * value back, so "Manage Preferences" was a dismiss button with a different
 * label and there was no way to refuse at all. Consent that cannot be refused
 * is not consent, and a stored choice nothing honours is worse than no banner:
 * it records agreement the visitor never gave.
 *
 * Nothing non-essential runs on AYO today. This exists so that when analytics
 * is added, the check is already here and the honest default — off until asked —
 * is the easy path.
 */

const STORAGE_KEY = 'ayd_cookie_consent';

export type ConsentChoice = 'accepted' | 'rejected';

/** Optional categories. Strictly necessary storage is not listed: it always runs. */
export type ConsentCategory = 'functional' | 'analytics';

/** The stored choice, or null if the visitor has not answered yet. */
export function readConsent(): ConsentChoice | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'accepted' || raw === 'rejected') return raw;
    // 'managed' was written by the earlier banner for a button that made no
    // choice. Treat it as unanswered and ask again rather than inferring consent.
    return null;
  } catch {
    // Private mode, or storage blocked. Unanswered is the safe reading.
    return null;
  }
}

export function writeConsent(choice: ConsentChoice): void {
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    /* If we cannot remember it, we will ask again. That is the correct failure. */
  }
}

/**
 * Whether a non-essential category may run. Call this before loading any
 * analytics or third-party script — never assume.
 */
export function hasConsentedTo(_category: ConsentCategory): boolean {
  return readConsent() === 'accepted';
}
