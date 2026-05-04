import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authHeader } from '@/lib/supabase-token';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const DOCS_API = `${API_BASE}/documents`;

export interface PkpbUploadDoc {
  id: string;
  countryId: string | null;
  country?: { id: string; name: string; isoCode3: string } | null;
  title: string;
  edition?: string | null;
  year?: number | null;
  createdAt: string;
  mimeType?: string | null;
  originalFilename?: string;
}

/** Per-country format presence — both pages and the upload form join on this. */
export interface CountryUploadStatus {
  /** Most recent doc of any format for this country (kept for back-compat). */
  doc: PkpbUploadDoc;
  /** True iff there's at least one HTML/XHTML doc on file for this country. */
  hasHtml: boolean;
  /** True iff there's at least one PDF doc on file for this country. */
  hasPdf: boolean;
}

const isHtmlDoc = (d: PkpbUploadDoc) =>
  /text\/html|xhtml/i.test(d.mimeType ?? '') ||
  /\.(html?|xhtml)$/i.test(d.originalFilename ?? '');
const isPdfDoc = (d: PkpbUploadDoc) =>
  /application\/pdf/i.test(d.mimeType ?? '') ||
  /\.pdf$/i.test(d.originalFilename ?? '');

const slugForCountryName = (name: string) =>
  name.toLowerCase().replace(/['.]/g, '').replace(/\s+/g, '-');

/**
 * Single source of truth for "which countries have an uploaded PKPB report,
 * and in which formats". Both the PKPB index and the public Countries grid
 * consume this so badges stay in sync — and `DataUpload` invalidates the
 * same query key on a successful upload, so progress updates immediately
 * without a manual reload.
 *
 * The hook returns:
 *   - `byCountryId` / `bySlug` / `byIso3`  → CountryUploadStatus lookups by
 *                                             different join keys (use the
 *                                             one that matches your country
 *                                             list's id namespace)
 *   - `count`                              → countries with any upload
 *   - `htmlCount` / `pdfCount`             → countries with HTML / PDF
 *   - `completeCount`                      → countries with BOTH HTML + PDF
 *   - `awaitingCount` (helper)             → totalCountries - count
 *                                             (caller passes totalCountries)
 */
export function usePkpbUploads() {
  const query = useQuery<PkpbUploadDoc[]>({
    queryKey: ['pkpb-by-country'],
    queryFn: async () => {
      const res = await fetch(`${DOCS_API}?type=PKPB_REPORT&limit=500`, { headers: authHeader() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 60000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: 2,
  });

  const indexes = useMemo(() => {
    const byCountryId = new Map<string, CountryUploadStatus>();
    const bySlug = new Map<string, CountryUploadStatus>();
    const byIso3 = new Map<string, CountryUploadStatus>();

    // Group docs by countryId, then derive HTML/PDF presence per group.
    const grouped = new Map<string, PkpbUploadDoc[]>();
    for (const d of query.data ?? []) {
      if (!d.countryId) continue;
      if (!grouped.has(d.countryId)) grouped.set(d.countryId, []);
      grouped.get(d.countryId)!.push(d);
    }

    for (const [cid, docs] of grouped) {
      // Newest doc is first (API sorts by year desc, createdAt desc).
      const newest = docs[0];
      const status: CountryUploadStatus = {
        doc: newest,
        hasHtml: docs.some(isHtmlDoc),
        hasPdf: docs.some(isPdfDoc),
      };
      byCountryId.set(cid, status);
      const name = newest.country?.name;
      if (name) bySlug.set(slugForCountryName(name), status);
      const iso3 = newest.country?.isoCode3;
      if (iso3) byIso3.set(iso3, status);
    }

    let htmlCount = 0;
    let pdfCount = 0;
    let completeCount = 0;
    for (const s of byCountryId.values()) {
      if (s.hasHtml) htmlCount++;
      if (s.hasPdf) pdfCount++;
      if (s.hasHtml && s.hasPdf) completeCount++;
    }

    return {
      byCountryId,
      bySlug,
      byIso3,
      count: byCountryId.size,
      htmlCount,
      pdfCount,
      completeCount,
    };
  }, [query.data]);

  return {
    ...indexes,
    docs: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
