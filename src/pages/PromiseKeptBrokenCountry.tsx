import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, Upload as UploadIcon, Download, Share2, Check, Printer } from 'lucide-react';
import CountryReportCard from '@/pages/CountryReportCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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
  mimeType?: string | null;
  extractedSummary?: Partial<CountryReport> | null;
  country?: { id: string; name: string; isoCode3: string };
}

interface PkpbResponse {
  country: { id: string; name: string; isoCode3: string };
  document: PkpbDocument | null;
}

/**
 * Page-level wrapper for /pkpb/:countryRef.
 *
 * **When a PKPB document is uploaded**, the page renders the document itself
 * full-screen — same design, same data, same text as what the contributor
 * uploaded. No parametric overlay, no React-rendered placeholder. A floating
 * action bar provides Back / Share / Print / Download.
 *
 * **When no document is uploaded yet**, we fall back to the parametric
 * CountryReportCard so the platform always has *something* to show, with a
 * clear CTA to upload.
 *
 * The route param can be a country slug ("nigeria"), ISO3, ISO2, or a country
 * id — the API resolves them all.
 */
const PromiseKeptBrokenCountry: React.FC = () => {
  const { countryRef } = useParams<{ countryRef: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [shareCopied, setShareCopied] = useState(false);

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

  // Parametric/real-data fallback for when nothing is uploaded yet.
  const { report: fallbackReport } = useCountryReportData(countryRef, null);

  const apiCountryName = data?.country?.name;
  const doc = data?.document;
  const filename = doc?.originalFilename?.toLowerCase() ?? '';
  const mime = doc?.mimeType ?? '';
  const isPdf = mime === 'application/pdf' || filename.endsWith('.pdf');
  const isHtml =
    mime === 'text/html' || mime === 'application/xhtml+xml' || filename.endsWith('.html') || filename.endsWith('.htm');
  const isEmbeddable = isPdf || isHtml;

  const downloadHref = doc ? `${DOCS_API}/${doc.id}/download` : undefined;
  const inlineHref = doc ? `${DOCS_API}/${doc.id}/download?disposition=inline` : undefined;
  const downloadFilename = doc?.originalFilename;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      toast({ title: 'Link copied', description: 'Share this URL to send the report directly.' });
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      toast({ title: 'Could not copy', description: window.location.href, variant: 'destructive' });
    }
  };

  const handleDownload = () => {
    if (!downloadHref) return;
    if (isHtml && inlineHref) {
      // HTML uploads → open inline + auto-print so users get a Save-as-PDF dialog.
      const win = window.open(inlineHref, '_blank');
      if (win) {
        const onLoad = () => { try { win.print(); } catch { /* ignore */ } };
        win.addEventListener('load', onLoad, { once: true });
      } else {
        toast({
          title: 'Pop-up blocked',
          description: 'Allow pop-ups so we can open the report and trigger Save-as-PDF.',
        });
      }
      return;
    }
    // PDFs / DOCX / etc. — straight download.
    const a = document.createElement('a');
    a.href = downloadHref;
    if (downloadFilename) a.download = downloadFilename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError && !fallbackReport) {
    return (
      <div className="container px-4 md:px-6 py-12">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="text-center py-20 text-gray-400">
          Could not load PKPB report for "{countryRef}".
        </div>
      </div>
    );
  }

  // ── A PKPB document HAS been uploaded ───────────────────────────────────
  // Render it full-screen, exactly as uploaded. The action bar floats at top.
  if (doc && inlineHref) {
    if (isEmbeddable) {
      return (
        <div className="fixed inset-0 lg:left-16 lg:hover:left-60 transition-[left] duration-200 ease-in-out flex flex-col bg-[#0a0e14] z-10">
          {/* Action bar */}
          <div className="flex-shrink-0 bg-background/95 backdrop-blur border-b border-white/[0.06]">
            <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 text-xs flex-shrink-0">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <div className="hidden sm:block min-w-0">
                  <p className="text-xs text-gray-400 truncate">
                    {doc.title}
                    {doc.edition && <span className="text-gray-600"> · {doc.edition}</span>}
                    {doc.source && <span className="text-gray-600"> · {doc.source}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={handleShare} className="gap-2 text-xs">
                  {shareCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  <span className="hidden sm:inline">{shareCopied ? 'Copied' : 'Share'}</span>
                </Button>
                <Button
                  size="sm"
                  onClick={handleDownload}
                  className="gap-2 text-xs"
                  style={{ background: '#C9942A', color: '#0D1B2A' }}
                >
                  {isHtml ? <Printer className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                  <span className="hidden sm:inline">{isHtml ? 'Save as PDF' : 'Download'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* The uploaded document, full-bleed. iframe sandbox keeps the page
              safe even if the HTML brings its own JS. allow-same-origin is
              required for our own R2-served content (so styles/fonts load). */}
          <iframe
            src={inlineHref}
            title={`${doc.title}`}
            className="flex-1 w-full border-0 bg-white"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      );
    }

    // Non-embeddable formats (DOCX, PPTX, etc.) — show a centered card with download.
    return (
      <div className="container px-4 md:px-6 py-12 max-w-2xl mx-auto">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-10 text-center">
          <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">{doc.title}</h1>
          <p className="text-sm text-gray-400 mb-6">{doc.originalFilename}</p>
          <p className="text-xs text-gray-500 mb-6 max-w-md mx-auto">
            This document type can't be rendered inline. Download it and open in your preferred viewer, or contact
            your editor to upload an HTML or PDF version for inline display.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={handleShare} className="gap-2">
              {shareCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              {shareCopied ? 'Copied' : 'Share'}
            </Button>
            <Button onClick={handleDownload} className="gap-2" style={{ background: '#C9942A', color: '#0D1B2A' }}>
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── No PKPB upload yet ──────────────────────────────────────────────────
  // Show the parametric React card so the page is never empty, plus a CTA.
  if (fallbackReport) {
    return (
      <CountryReportCard
        country={fallbackReport.country}
        reportOverride={fallbackReport}
        onBack={() => navigate(-1)}
      />
    );
  }

  // Catch-all empty state (no real data + no upload).
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
          Once a contributor uploads one, this page will render their document exactly as designed.
        </p>
        <Link to="/dashboard/data-upload">
          <Button className="gap-2">
            <UploadIcon className="h-4 w-4" /> Upload a PKPB report
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default PromiseKeptBrokenCountry;
