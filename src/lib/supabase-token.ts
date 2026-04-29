// Read the Supabase access token synchronously from localStorage.
// Supabase stores the session under `sb-{projectRef}-auth-token` where
// projectRef is the subdomain of VITE_SUPABASE_URL.
//
// The legacy `ayd_token` key is checked as a fallback for back-compat with
// older code paths.

export function getSupabaseAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || '';
    if (supabaseUrl) {
      const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
      const raw = localStorage.getItem(`sb-${projectRef}-auth-token`);
      if (raw) {
        const parsed = JSON.parse(raw);
        const token: string | undefined =
          parsed?.access_token ?? parsed?.currentSession?.access_token;
        if (token) return token;
      }
    }
  } catch {
    /* fall through to legacy */
  }
  return localStorage.getItem('ayd_token');
}

export function authHeader(): Record<string, string> {
  const token = getSupabaseAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
