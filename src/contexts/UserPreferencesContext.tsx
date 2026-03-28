import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export interface UserPreferences {
  myCountry: string | null;
  favoriteCountries: string[];
  recentlyViewed: string[];
  preferredRegion: string | null;
  preferredTheme: string | null;
  lastExploreFilters: {
    country: string;
    theme: string;
    indicator: string;
    yearRange: [number, number];
  } | null;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  myCountry: null,
  favoriteCountries: [],
  recentlyViewed: [],
  preferredRegion: null,
  preferredTheme: null,
  lastExploreFilters: null,
};

interface UserPreferencesContextType {
  preferences: UserPreferences;
  setMyCountry: (country: string | null) => void;
  addFavoriteCountry: (country: string) => void;
  removeFavoriteCountry: (country: string) => void;
  isFavorite: (country: string) => boolean;
  trackCountryView: (country: string) => void;
  setPreferredRegion: (region: string | null) => void;
  setPreferredTheme: (theme: string | null) => void;
  saveExploreFilters: (filters: UserPreferences['lastExploreFilters']) => void;
  resetPreferences: () => void;
  isPersonalized: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | null>(null);

const STORAGE_KEY = 'ayd_user_preferences';

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_PREFERENCES;
  });

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const setMyCountry = useCallback((country: string | null) => {
    setPreferences(prev => ({ ...prev, myCountry: country }));
  }, []);

  const addFavoriteCountry = useCallback((country: string) => {
    setPreferences(prev => {
      if (prev.favoriteCountries.includes(country)) return prev;
      return { ...prev, favoriteCountries: [...prev.favoriteCountries, country].slice(0, 10) };
    });
  }, []);

  const removeFavoriteCountry = useCallback((country: string) => {
    setPreferences(prev => ({
      ...prev,
      favoriteCountries: prev.favoriteCountries.filter(c => c !== country),
    }));
  }, []);

  const isFavorite = useCallback((country: string) => {
    return preferences.favoriteCountries.includes(country);
  }, [preferences.favoriteCountries]);

  const trackCountryView = useCallback((country: string) => {
    setPreferences(prev => {
      const filtered = prev.recentlyViewed.filter(c => c !== country);
      return { ...prev, recentlyViewed: [country, ...filtered].slice(0, 8) };
    });
  }, []);

  const setPreferredRegion = useCallback((region: string | null) => {
    setPreferences(prev => ({ ...prev, preferredRegion: region }));
  }, []);

  const setPreferredTheme = useCallback((theme: string | null) => {
    setPreferences(prev => ({ ...prev, preferredTheme: theme }));
  }, []);

  const saveExploreFilters = useCallback((filters: UserPreferences['lastExploreFilters']) => {
    setPreferences(prev => ({ ...prev, lastExploreFilters: filters }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  const isPersonalized = useMemo(() => {
    return preferences.myCountry !== null;
  }, [preferences.myCountry]);

  const value = useMemo(() => ({
    preferences,
    setMyCountry,
    addFavoriteCountry,
    removeFavoriteCountry,
    isFavorite,
    trackCountryView,
    setPreferredRegion,
    setPreferredTheme,
    saveExploreFilters,
    resetPreferences,
    isPersonalized,
  }), [preferences, setMyCountry, addFavoriteCountry, removeFavoriteCountry, isFavorite, trackCountryView, setPreferredRegion, setPreferredTheme, saveExploreFilters, resetPreferences, isPersonalized]);

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) throw new Error('useUserPreferences must be used within UserPreferencesProvider');
  return ctx;
}
