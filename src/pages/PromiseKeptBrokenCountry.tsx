import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, Upload as UploadIcon, Download, ExternalLink } from 'lucide-react';
import CountryReportCard from '@/pages/CountryReportCard';
import { Button } from '@/components/ui/button';
import { type CountryReport } from '@/data/countryReports';
import { useCountryReportData } from '@/hooks/useCountryReportData';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const DOCS_API = `${API_BASE}/documents`;

interface PkpbDocument {
  id: string;
  title: string;
  edition?: string | null;
  source?: string | null;
  year?: number | null;
  originalFilename: string;
  extractedSummary?: Partial<CountryReport> | null;
  country?: { id: string; name: string; isoCode3: string };
}

interface PkpbResponse {
  country: { id: string; name: string; isoCode3: string };
  document: PkpbDocument | null;
}

/**
 * Page-level wrapper for /pkpb/:countryRef. Resolves the latest uploaded PKPB
 * document for the country and renders the standard CountryReportCard with
 * any uploaded summary fields overlaid on the parametric defaults. The
 * original PDF (in R2) is wired up to the Download Report Card button.
 *
 * The route param can be a country slug (e.g. "nigeria"), an ISO3 code, or a
 * country id — the API resolves all three.
 */
const PromiseKeptBrokenCountry: React.FC = () => {
  const { countryRef } = useParams<{ countryRef: string }>();
  const navigate = useNavigate();
  const [pdfLoadError, setPdfLoadError] = useState(false);

  const { data, isLoading, isError } = useQuery<PkpbResponse>({
    queryKey: ['pkpb', countryRef],
    queryFn: async () => {
      const res = await fetch(`${DOCS_API}/by-country/${encodeURIComponent(countryRef!)}/pkpb`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    enabled: !!countryRef,
    retry: 1,
  });

  const apiCountryName = data?.country?.name;

  // Cascade: parametric defaults ← real IndicatorValue data ← uploaded PKPB summary.
  // The hook handles layers 1+2; we pass the PKPB document's extractedSummary as
  // the highest-priority overlay.
  const { report: merged } = useCountryReportData(
    countryRef,
    (data?.document?.extractedSummary ?? null) as Partial<CountryReport> | null,
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError && !merged) {
    return (
      <div className="container px-4 md:px-6 py-12">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="text-center py-20 text-gray-400">Could not load PKPB report for "{countryRef}".</div>
      </div>
    );
  }

  if (!merged && !data?.document) {
    return (
      <div className="container px-4 md:px-6 py-12">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="max-w-xl mx-auto text-center py-16">
          <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4 opacity-60" />
          <h1 className="text-2xl font-semibold mb-2">No PKPB report yet</h1>
          <p className="text-gray-400 mb-6">
            A Promise Kept · Promise Broken report has not been uploaded for {apiCountryName ?? countryRef}.
            Once a contributor uploads a PDF for this country, this page will show its full report card and
            offer the original PDF for download.
          </p>
          <Link to="/dashboard/data-upload">
            <Button className="gap-2">
              <UploadIcon className="h-4 w-4" /> Upload a PKPB report
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const doc = data?.document;
  const downloadHref = doc ? `${DOCS_API}/${doc.id}/download` : undefined;
  const inlineHref = doc ? `${DOCS_API}/${doc.id}/download?disposition=inline` : undefined;
  const downloadFilename = doc?.originalFilename;
  const isPdf = doc?.originalFilename?.toLowerCase().endsWith('.pdf');
  const isHtml = doc?.originalFilename?.toLowerCase().endsWith('.html') || doc?.originalFilename?.toLowerCase().endsWith('.htm');

  return (
    <>
      <CountryReportCard
        country={merged!.country}
        reportOverride={merged!}
        downloadHref={downloadHref}
        downloadFilename={downloadFilename}
        onBack={() => navigate(-1)}
      />

      {/* ── Original document — inline preview + download ── */}
      {doc && inlineHref && (
        <section className="bg-[#0a0e14] border-t border-white/[0.06] py-12 md:py-16">
          <div className="container px-6 md:px-12 max-w-5xl">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
              <div>
                <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#D4A017]/70 font-medium mb-1">
                  Source Document
                </p>
                <h2 className="font-bold text-2xl md:text-3xl text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Original Report
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {doc.title}
                  {doc.edition && <> · <span className="italic">{doc.edition}</span></>}
                  {doc.source && <> · {doc.source}</>}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <a href={inlineHref} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" /> Open in new tab
                  </Button>
                </a>
                <a href={downloadHref} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="gap-1.5" style={{ background: '#C9942A', color: '#0D1B2A' }}>
                    <Download className="h-3.5 w-3.5" /> Download
                  </Button>
                </a>
              </div>
            </div>

            {/* Inline preview — works for PDFs and HTML out of the box.
                Other formats fall back to a download CTA. */}
            {(isPdf || isHtml) && !pdfLoadError ? (
              <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-black/40">
                <iframe
                  src={inlineHref}
                  title={`${doc.title} — original document`}
                  className="w-full"
                  style={{ height: '80vh', minHeight: 600 }}
                  onError={() => setPdfLoadError(true)}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-8 text-center">
                <FileText className="h-10 w-10 text-gray-500 mx-auto mb-3" />
                <p className="text-sm text-gray-300">{doc.originalFilename}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Inline preview isn't supported for this file type. Use the buttons above to open or download it.
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
};

export default PromiseKeptBrokenCountry;
