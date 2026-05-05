
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronRight, Globe, MapPin, Star, FileText } from 'lucide-react';
import CountryFlag from '@/components/CountryFlag';
import { getCountryMeta } from '@/lib/country-flags';
import { SparklineChart } from '@/components/SparklineChart';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Content } from '@/components/cms';
import ScrollReveal from '@/components/ScrollReveal';

// Slugify a country name for the URL: "South Africa" → "south-africa". The
// PKPB country resolver on the API accepts id, ISO3, ISO2, name, or slug,
// so this is the friendliest form for the URL bar.
const toCountrySlug = (name: string) =>
  name.toLowerCase().replace(/['.]/g, '').replace(/\s+/g, '-');

// Fallback data in case API is not available
const regionsMapFallback: Record<string, string[]> = {
  "North Africa": ["Algeria", "Egypt", "Libya", "Morocco", "Tunisia"],
  "West Africa": ["Benin", "Burkina Faso", "Cabo Verde", "Côte d'Ivoire", "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Liberia", "Mali", "Mauritania", "Niger", "Nigeria", "Senegal", "Sierra Leone", "Togo"],
  "Central Africa": ["Cameroon", "Central African Republic", "Chad", "Congo", "DRC", "Equatorial Guinea", "Gabon", "São Tomé and Príncipe"],
  "East Africa": ["Burundi", "Comoros", "Djibouti", "Eritrea", "Ethiopia", "Kenya", "Madagascar", "Mauritius", "Rwanda", "Seychelles", "Somalia", "South Sudan", "Sudan", "Tanzania", "Uganda"],
  "Southern Africa": ["Angola", "Botswana", "Eswatini", "Lesotho", "Malawi", "Mozambique", "Namibia", "South Africa", "Zambia", "Zimbabwe"]
};

const regionColors: Record<string, string> = {
  "North Africa": "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  "West Africa": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  "Central Africa": "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  "East Africa": "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
  "Southern Africa": "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
};

const regionSparklineColors: Record<string, string> = {
  "North Africa": "#3b82f6",
  "West Africa": "#10b981",
  "Central Africa": "#f59e0b",
  "East Africa": "#a855f7",
  "Southern Africa": "#f43f5e",
};

const allRegions = ["All", "North Africa", "West Africa", "Central Africa", "East Africa", "Southern Africa"];

// Deterministic pseudo-random data points per country for sparkline
function getSparklineData(country: string): number[] {
  let seed = 0;
  for (let i = 0; i < country.length; i++) seed += country.charCodeAt(i);
  return Array.from({ length: 8 }, (_, i) => 20 + ((seed * (i + 1) * 7) % 80));
}

const Countries = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { preferences, trackCountryView } = useUserPreferences();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRegion, setActiveRegion] = useState('All');

  // Fetch countries from API
  const { data: apiResponse, isLoading, isError } = useQuery({
    queryKey: ['countries', { region: activeRegion === 'All' ? undefined : activeRegion, search: searchTerm || undefined }],
    queryFn: () => api.countries.list({
      region: activeRegion === 'All' ? undefined : activeRegion,
      search: searchTerm || undefined,
    }),
  });

  const filteredCountries = useMemo(() => {
    // Use API data if available
    const apiData = (apiResponse as any)?.data || apiResponse;
    if (Array.isArray(apiData) && apiData.length > 0) {
      let entries = apiData.map((c: any) => ({
        country: c.name,
        region: c.region || 'Unknown',
        id: c.id,
        capital: c.capital,
        flagEmoji: c.flagEmoji,
        isoCode3: c.isoCode3 || c.iso3Code,
      }));

      // Sort user's country to the top
      if (preferences.myCountry) {
        entries.sort((a: any, b: any) => {
          const aIsMyCountry = a.country.toLowerCase() === preferences.myCountry!.toLowerCase();
          const bIsMyCountry = b.country.toLowerCase() === preferences.myCountry!.toLowerCase();
          if (aIsMyCountry && !bIsMyCountry) return -1;
          if (!aIsMyCountry && bIsMyCountry) return 1;
          return 0;
        });
      }
      return entries;
    }

    // Fallback to hardcoded data
    let entries: { country: string; region: string }[] = [];
    const regionsToShow = activeRegion === 'All' ? Object.keys(regionsMapFallback) : [activeRegion];
    for (const region of regionsToShow) {
      for (const country of (regionsMapFallback[region] || [])) {
        if (country.toLowerCase().includes(searchTerm.toLowerCase())) {
          entries.push({ country, region });
        }
      }
    }
    if (preferences.myCountry) {
      entries.sort((a, b) => {
        const aIsMyCountry = a.country.toLowerCase() === preferences.myCountry!.toLowerCase();
        const bIsMyCountry = b.country.toLowerCase() === preferences.myCountry!.toLowerCase();
        if (aIsMyCountry && !bIsMyCountry) return -1;
        if (!aIsMyCountry && bIsMyCountry) return 1;
        return 0;
      });
    }
    return entries;
  }, [apiResponse, searchTerm, activeRegion, preferences.myCountry]);

  return (
    <>
      <div className="relative py-8 md:py-12 overflow-hidden">
        <div className="absolute inset-0 opacity-30 w-full bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:6rem_5rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col gap-3 md:gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-6 w-6 text-[#D4A017]" />
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tighter">
                  <span className="text-white/60">Country</span>{' '}
                  <span
                    className="bg-gradient-to-r from-[#D4A017] via-[#F5D575] to-[#D4A017] bg-clip-text text-transparent font-bold"
                    style={{ textShadow: '0 0 24px rgba(212, 160, 23, 0.35)' }}
                  >
                    Report Card
                  </span>
                </h1>
              </div>
              <p className="text-sm sm:text-base text-[#A89070]">
                Promise Kept · Promise Broken — youth empowerment audit across all 54 African nations.
              </p>
            </div>

            <div className="flex w-full max-w-md mt-2 md:mt-4">
              <Input
                type="search"
                placeholder={t('countries.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-r-none text-sm border-gray-800 bg-white/[0.03]"
              />
              <Button className="rounded-l-none px-3 sm:px-4">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Region filter tabs */}
            <div className="flex flex-wrap gap-2 mt-2">
              {allRegions.map((region) => (
                <Button
                  key={region}
                  variant={activeRegion === region ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveRegion(region)}
                  className="text-xs sm:text-sm"
                >
                  {region === 'All' && <MapPin className="h-3 w-3 mr-1" />}
                  {region}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="py-6 md:py-8">
        <div className="container px-4 md:px-6">
          {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-3 md:gap-4">
                {Array.from({ length: 15 }).map((_, i) => (
                  <Card key={i} className="rounded-2xl border border-gray-800 bg-white/[0.03]">
                    <CardContent className="p-4 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-7 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredCountries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <Content as="p" id="countries.empty.title" fallback="No countries found" className="text-lg font-medium" />
                <Content as="p" id="countries.empty.description" fallback="Try adjusting your search or region filter." className="text-sm mt-1" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-3 md:gap-4">
                  {filteredCountries.map(({ country, region }: any, idx: number) => {
                    const sparklineData = getSparklineData(country);
                    const isMyCountry = preferences.myCountry && country.toLowerCase() === preferences.myCountry.toLowerCase();
                    // Stagger fade-in caps at 12 so a 54-country grid still
                    // finishes its entrance quickly even on first paint.
                    const revealIndex = Math.min(idx, 12);
                    return (
                      <ScrollReveal key={country} index={revealIndex}>
                      <Card
                        className={`hover-lift cursor-pointer group rounded-2xl border border-gray-800 bg-white/[0.03] hover:border-gray-600 transition-colors ${isMyCountry ? 'ring-2 ring-[#D4A017] border-[#D4A017]/50' : ''}`}
                        onClick={() => {
                          trackCountryView(country);
                          // Single source of truth: route to the PKPB country
                          // page. When a contributor has uploaded an HTML/PDF
                          // report it renders that file in a sandboxed iframe
                          // (preserving the original design + branding 1:1, with
                          // a Download button that streams the original file);
                          // when none is uploaded it falls back to the parametric
                          // CountryReportCard with real DB data.
                          navigate(`/dashboard/pkpb/${toCountrySlug(country)}`);
                        }}
                      >
                        <CardContent className="p-2.5 sm:p-4 flex flex-col gap-1.5 sm:gap-2.5">
                          <div className="flex flex-col gap-1 sm:gap-1.5">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <CountryFlag country={country} size="md" />
                              <span className="text-xs sm:text-base font-bold leading-tight line-clamp-1">
                                {country}
                              </span>
                              {isMyCountry && <Star className="h-3 w-3 sm:h-4 sm:w-4 text-[#D4A017] fill-[#D4A017] flex-shrink-0" />}
                            </div>
                            {(() => {
                              const meta = getCountryMeta(country);
                              return meta ? (
                                <>
                                  <span className="text-[11px] text-gray-400">{meta.capital}</span>
                                  <div className="flex flex-wrap gap-1">
                                    {meta.languages.slice(0, 2).map((lang) => (
                                      <Badge key={lang} variant="secondary" className="text-[9px] px-1 py-0 h-4">
                                        {lang}
                                      </Badge>
                                    ))}
                                  </div>
                                </>
                              ) : null;
                            })()}
                            <Badge
                              variant="outline"
                              className={`w-fit text-[10px] px-1.5 py-0 ${regionColors[region] || ''}`}
                            >
                              {region}
                            </Badge>
                          </div>

                          {/* Sparkline chart */}
                          <div className="mt-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <SparklineChart
                              data={sparklineData}
                              color={regionSparklineColors[region] || '#888'}
                              width={100}
                              height={28}
                            />
                          </div>

                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[11px] sm:text-xs text-gray-500 font-medium group-hover:text-[#D4A017] transition-colors">
                              View Report Card
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 text-gray-500 group-hover:text-[#D4A017] group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </CardContent>
                      </Card>
                      </ScrollReveal>
                    );
                  })}
                </div>
              </>
          )}
        </div>
      </div>

    </>
  );
};

export default Countries;
