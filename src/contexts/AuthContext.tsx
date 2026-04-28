import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { triggerDashboardSync } from '@/services/dashboard';

const _viteUrl = import.meta.env.VITE_API_URL as string | undefined;
const API_BASE = (_viteUrl && _viteUrl.startsWith('http'))
  ? _viteUrl
  : (import.meta.env.PROD ? 'https://african-youth-observatory.onrender.com/api' : '/api');

export type UserRole = 'PUBLIC' | 'REGISTERED' | 'RESEARCHER' | 'CONTRIBUTOR' | 'INSTITUTIONAL' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: string;
  avatar?: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Ensures a row exists in our backend DB for the authenticated Supabase user.
// Hitting GET /auth/profile triggers jwt.strategy.ts which JIT-provisions the
// user row on first login. Fire-and-forget — the frontend never needs to wait
// on this; awaiting it can pin the loading spinner during Render cold starts
// (up to 60s on free tier) or when the backend rejects tokens.
async function syncBackendUser(accessToken: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn(
        `[auth-sync] Backend /auth/profile returned ${res.status}. Non-fatal — continuing with Supabase profile. Body: ${body.slice(0, 120)}`,
      );
      return;
    }
    console.log('[auth-sync] Backend user row confirmed / provisioned');
  } catch (e) {
    console.warn('[auth-sync] /auth/profile call failed. Non-fatal — continuing with Supabase profile.', e);
  }
}

async function fetchProfile(
  accessToken: string,
  fallback: { id: string; email: string; name?: string },
): Promise<User> {
  // Primary: fetch role/profile directly from Supabase User table
  try {
    const { data, error } = await supabase
      .from('User')
      .select('id, email, name, role, organization, avatar')
      .eq('id', fallback.id)
      .single();
    if (!error && data) {
      return {
        id: data.id,
        name: data.name || fallback.name || fallback.email.split('@')[0],
        email: data.email,
        role: (data.role || 'REGISTERED').toUpperCase() as UserRole,
        organization: data.organization,
        avatar: data.avatar,
      };
    }
  } catch { /* fall through */ }

  // Secondary: try backend (may be sleeping on free tier)
  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        id: data.id,
        name: data.name || fallback.email.split('@')[0],
        email: data.email,
        role: (data.role || 'REGISTERED').toUpperCase() as UserRole,
        organization: data.organization,
        avatar: data.avatar,
      };
    }
  } catch { /* fall through */ }

  // Last resort fallback
  return {
    id: fallback.id,
    name: fallback.name || fallback.email.split('@')[0],
    email: fallback.email,
    role: 'REGISTERED',
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hasHashToken = typeof window !== 'undefined' && window.location.hash.includes('access_token');
    const hasCode = typeof window !== 'undefined' && window.location.search.includes('code=');
    const hasError = typeof window !== 'undefined' && (window.location.hash.includes('error') || window.location.search.includes('error'));
    console.log('[auth] mount — url hints:', { hasHashToken, hasCode, hasError, href: window.location.href });

    let mounted = true;
    // Hard deadline: never keep the app on the loading spinner longer than 3s,
    // even if Supabase or the backend stalls. After this fires, isLoading goes
    // false and routing proceeds; setUser may still arrive later.
    const loadingDeadline = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 3000);

    supabase.auth.getSession().then(async ({ data: { session: s }, error }) => {
      console.log('[auth] getSession resolved —', { hasSession: !!s, email: s?.user?.email, error: error?.message });
      if (!mounted) return;
      setSession(s);
      if (s) {
        // Fire-and-forget — non-essential to render the app
        void syncBackendUser(s.access_token);
        try {
          const profile = await fetchProfile(s.access_token, {
            id: s.user.id,
            email: s.user.email ?? '',
            name: s.user.user_metadata?.name,
          });
          if (mounted) {
            setUser(profile);
            triggerDashboardSync();
          }
        } catch (e) {
          console.warn('[auth] fetchProfile failed:', e);
        }
      }
      if (mounted) {
        setIsLoading(false);
        clearTimeout(loadingDeadline);
      }
    }).catch((e) => {
      console.warn('[auth] getSession threw:', e);
      if (mounted) setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      console.log('[auth] onAuthStateChange —', { event, hasSession: !!s, email: s?.user?.email, provider: s?.user?.app_metadata?.provider });
      if (!mounted) return;
      setSession(s);
      if (s) {
        void syncBackendUser(s.access_token);
        try {
          const profile = await fetchProfile(s.access_token, {
            id: s.user.id,
            email: s.user.email ?? '',
            name: s.user.user_metadata?.name,
          });
          if (mounted) {
            setUser(profile);
            triggerDashboardSync();
          }
        } catch (e) {
          console.warn('[auth] fetchProfile failed:', e);
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(loadingDeadline);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(() => {
    void supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const getToken = useCallback(() => session?.access_token ?? null, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: !!user, isLoading, signIn, signUp, signOut, getToken }),
    [user, isLoading, signIn, signUp, signOut, getToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
