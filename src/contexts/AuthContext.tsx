import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('ayd_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetch(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .then(data => {
        setUser({
          id: data.id,
          name: data.name || data.email.split('@')[0],
          email: data.email,
          role: (data.role || 'REGISTERED').toUpperCase() as UserRole,
          organization: data.organization,
          avatar: data.avatar,
        });
      })
      .catch(() => {
        localStorage.removeItem('ayd_token');
        localStorage.removeItem('ayd_refresh_token');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Invalid credentials');
      }
      const data = await res.json();
      const accessToken = data.tokens?.accessToken || data.token;
      const refreshToken = data.tokens?.refreshToken;
      if (accessToken) localStorage.setItem('ayd_token', accessToken);
      if (refreshToken) localStorage.setItem('ayd_refresh_token', refreshToken);
      setUser({
        id: data.user.id,
        name: data.user.name || data.user.email.split('@')[0],
        email: data.user.email,
        role: (data.user.role || 'REGISTERED').toUpperCase() as UserRole,
        organization: data.user.organization,
        avatar: data.user.avatar,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Registration failed');
      }
      const data = await res.json();
      const accessToken = data.tokens?.accessToken || data.token;
      const refreshToken = data.tokens?.refreshToken;
      if (accessToken) localStorage.setItem('ayd_token', accessToken);
      if (refreshToken) localStorage.setItem('ayd_refresh_token', refreshToken);
      setUser({
        id: data.user.id,
        name: data.user.name || name,
        email: data.user.email,
        role: (data.user.role || 'REGISTERED').toUpperCase() as UserRole,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('ayd_token');
    localStorage.removeItem('ayd_refresh_token');
    localStorage.removeItem('ayd_user');
    setUser(null);
  }, []);

  const getToken = useCallback(() => localStorage.getItem('ayd_token'), []);

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
