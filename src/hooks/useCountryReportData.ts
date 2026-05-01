import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCountryReport, type CountryReport } from '@/data/countryReports';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const REPORTS_API = `${API_BASE}/country-reports`;

interface RealReportPayload {
  country: string;
  iso3: string;
  slug: string;
  lastDataYear: number | null;
  indicatorCount: number;
  hasRealData: boolean;
  real: Partial<CountryReport>;
  indicators: CountryReport['indicators'] | null;
}

/**
 * Builds a CountryReport for a country by cascading three layers:
 *
 *   parametric defaults  ←  real IndicatorValue data  ←  PKPB extractedSummary
 *
 * Each layer overrides the previous one *only for fields it actually has*. So
 * you get a fully-populated card immediately (parametric), with real numbers
 * filling in as contributors upload data, and explicit narrative overrides
 * winning when an editor curates a PKPB report.
 *
 * `pkpbSummary` is optional — pass it from the PKPB page where we have an
 * uploaded document. The country profile page omits it.
 */
export function useCountryReportData(
  countryRef: string | undefined,
  pkpbSummary?: Partial<CountryReport> | null,
) {
  const realQuery = useQuery<RealReportPayload | null>({
    queryKey: ['country-report-real', countryRef],
    queryFn: async () => {
      if (!countryRef) return null;
      const res = await fetch(`${REPORTS_API}/${encodeURIComponent(countryRef)}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!countryRef,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const merged = useMemo<CountryReport | null>(() => {
    if (!countryRef) return null;
    const base = getCountryReport(countryRef) ?? (realQuery.data?.country ? getCountryReport(realQuery.data.country) : null);
    if (!base) return null;

    let out: CountryReport = { ...base };

    // Layer 1: real-data overlay from /api/country-reports
    const real = realQuery.data?.real;
    if (real) {
      for (const [k, v] of Object.entries(real)) {
        if (v === null || v === undefined) continue;
        if (Array.isArray(v) && v.length === 0) continue;
        if (typeof v === 'string' && v.trim() === '') continue;
        (out as any)[k] = v;
      }
    }
    // Replace indicators array entirely if we have real ones — they're authoritative
    // when present. Otherwise keep the parametric tiles.
    if (realQuery.data?.indicators?.length) {
      out.indicators = realQuery.data.indicators;
    }

    // Layer 2: PKPB document extractedSummary (highest priority — explicit editor input)
    if (pkpbSummary) {
      for (const [k, v] of Object.entries(pkpbSummary)) {
        if (v === undefined || v === null) continue;
        if (Array.isArray(v) && v.length === 0) continue;
        if (typeof v === 'string' && v.trim() === '') continue;
        (out as any)[k] = v;
      }
    }

    return out;
  }, [countryRef, realQuery.data, pkpbSummary]);

  return {
    report: merged,
    isLoading: realQuery.isLoading,
    realPayload: realQuery.data ?? null,
  };
}
