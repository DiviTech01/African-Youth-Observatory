
import React from 'react';
import { Link } from 'react-router-dom';
import Hero from '@/components/home/Hero';
import NLQSearchBar from '@/components/NLQSearchBar';
import QuickStats from '@/components/home/QuickStats';
import FeaturedData from '@/components/home/FeaturedData';
import Partners from '@/components/home/Partners';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import CountryFlag from '@/components/CountryFlag';

const Index = () => {
  const { preferences, isPersonalized } = useUserPreferences();

  return (
    <>
      {isPersonalized && preferences.myCountry ? (
        <>
          {/* Personalized hero override: subtle banner above the standard Hero */}
          <div className="bg-primary/5 border-b">
            <div className="container px-4 md:px-6 py-3 flex items-center justify-center gap-3 text-sm">
              <CountryFlag country={preferences.myCountry} size="md" />
              <span className="font-medium">
                Your data hub for {preferences.myCountry}
              </span>
            </div>
          </div>
          <Hero />
        </>
      ) : (
        <Hero />
      )}
      <section className="py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <NLQSearchBar />
          {/* Personalized favorites quick-access row */}
          {isPersonalized && preferences.favoriteCountries.length > 0 && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground">Your Favorites</p>
              <div className="flex flex-wrap justify-center gap-2">
                {preferences.favoriteCountries.map((country) => (
                  <Link
                    key={country}
                    to={`/countries?country=${encodeURIComponent(country)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-background hover:bg-muted transition-colors text-sm"
                  >
                    <CountryFlag country={country} size="xs" />
                    <span>{country}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      <QuickStats />
      <FeaturedData />
      <Partners />
    </>
  );
};

export default Index;
