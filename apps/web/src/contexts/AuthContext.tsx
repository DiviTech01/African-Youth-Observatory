// ============================================
// AFRICAN YOUTH DATABASE — AUTH CONTEXT
// JWT-based auth wired to the NestJS backend
// ============================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const _envUrl = import.meta.env.VITE_API_URL as string | undefined;
// Only use the env var if it's a full URL (not a relative path like /api)
const API_BASE = (_envUrl && _envUrl.startsWith('http'))
  ? _envUrl
  : (import.meta.env.PROD
    ? 'https://african-youth-observatory.onrender.com/api'
    : '/api');

// ============================================
// TYPES
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organization?: string | null;
  avatar?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, organization?: string) => Promise<void>;
  signOut: () => void;
  token: string | null;
}

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'ayd_access_token';
const USER_KEY  = 'ayd_user';

// ============================================
// PROVIDER
// ============================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser  = localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // corrupted storage — clear it
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persist = (accessToken: string, authUser: AuthUser) => {
    setToken(accessToken);
    setUser(authUser);
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
  };

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message ?? 'Invalid email or password');
    }

    const data = await res.json() as { user: AuthUser; tokens: { accessToken: string } };
    persist(data.tokens.accessToken, data.user);
  }, []);

  const signUp = useCallback(async (
    name: string,
    email: string,
    password: string,
    organization?: string,
  ) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, organization }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message ?? 'Could not create account');
    }

    const data = await res.json() as { user: AuthUser; tokens: { accessToken: string } };
    persist(data.tokens.accessToken, data.user);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      signIn,
      signUp,
      signOut,
      token,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================
// HOOK
// ============================================

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
