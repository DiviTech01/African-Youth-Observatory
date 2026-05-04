import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Upload as UploadIcon, Download, Share2, Check, Printer, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { type CountryReport } from '@/data/countryReports';
import CountryFlag from '@/components/CountryFlag';
import ScrollReveal from '@/components/ScrollReveal';

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
  /** Freshest doc of any format — back-compat field, kept so older clients still work. */
  document: PkpbDocument | null;
  /** Freshest HTML doc on file — used for inline render with animations. */
  htmlDocument: PkpbDocument | null;
  /** Freshest PDF doc on file — preferred target for the Download button. */
  pdfDocument: PkpbDocument | null;
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
 * "Coming soon" placeholder so we never serve a generic Nigeria-style
 * template — each country's PKPB has its own design and we surface that
 * truthfully, with an upload CTA for users who can contribute.
 *
 * The route param can be a country slug ("nigeria"), ISO3, ISO2, or a country
 * id — the API resolves them all.
 */
const PromiseKeptBrokenCountry: React.FC = () => {
  const { countryRef } = useParams<{ countryRef: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const canUpload = user?.role === 'CONTRIBUTOR' || user?.role === 'ADMIN';
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

  // Pretty country name from the API when available, otherwise a slug→title-case
  // fallback so the page never reads "south-africa". Used in the loading,
  // coming-soon, and error states alike.
  const displayCountry =
    data?.country?.name ??
    (countryRef
      ? countryRef.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : 'this country');

  // Format-routing pipeline:
  //   - HTML on file → render that inline (with our animation injection).
  //   - PDF on file  → preferred target for the Download button (canonical
  //                    archival format users actually want to keep).
  //   - HTML missing + PDF present → "HTML coming soon" placeholder + Download PDF.
  //   - HTML present, PDF missing  → render inline, Download serves the HTML.
  const htmlDoc = data?.htmlDocument ?? null;
  const pdfDoc = data?.pdfDocument ?? null;

  // The doc we display inline (always HTML when available). For older API
  // responses that didn't split formats, fall back to whatever's on `document`
  // if it happens to be embeddable.
  const inlineDoc =
    htmlDoc ??
    (data?.document && /text\/html|xhtml/i.test(data.document.mimeType ?? '') ? data.document : null);

  // The doc we serve from the Download button — PDF is the preferred archival
  // target. If only HTML exists we let users save the HTML (browser print-as-PDF
  // is the canonical fallback path for those).
  const downloadDoc = pdfDoc ?? inlineDoc ?? data?.document ?? null;

  const filename = inlineDoc?.originalFilename?.toLowerCase() ?? '';
  const mime = inlineDoc?.mimeType ?? '';
  const isPdf = mime === 'application/pdf' || filename.endsWith('.pdf');
  const isHtml =
    mime === 'text/html' || mime === 'application/xhtml+xml' || filename.endsWith('.html') || filename.endsWith('.htm');
  const isEmbeddable = isPdf || isHtml;

  // The legacy `doc` reference is kept so existing render branches (action
  // bar metadata, iframe load tracking, etc.) keep compiling without rewrite.
  const doc = inlineDoc;

  const downloadHref = downloadDoc ? `${DOCS_API}/${downloadDoc.id}/download` : undefined;
  const inlineHref = inlineDoc ? `${DOCS_API}/${inlineDoc.id}/download?disposition=inline` : undefined;
  const downloadFilename = downloadDoc?.originalFilename;

  // Iframes don't fire `error` on HTTP failures — they just render the server's
  // error page. Probe the inline URL with HEAD up front so we can swap to a
  // clear "file unreachable" state when storage is misconfigured (e.g. R2 not
  // set up in local dev for a doc whose bytes live in production storage).
  type BytesState = 'unknown' | 'available' | 'unreachable';
  const [bytesState, setBytesState] = useState<BytesState>('unknown');

  // Tracks whether the iframe has finished loading the contributor's HTML, so
  // we can fade it in instead of flashing a white frame while bytes stream in.
  // Reset whenever the doc id changes (navigating between countries).
  const [iframeLoaded, setIframeLoaded] = useState(false);
  useEffect(() => { setIframeLoaded(false); }, [inlineHref]);

  // Listen for navigation requests posted from the iframe — the injected
  // animation script in the served HTML rewires the "Access AYIMS Platform"
  // CTA to postMessage('ayd-pkpb:navigate'), which is cross-origin-safe in
  // production where the iframe and parent live on different hosts.
  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      const data = ev.data;
      if (!data || typeof data !== 'object') return;
      if (data.type !== 'ayd-pkpb:navigate') return;
      const path = typeof data.path === 'string' ? data.path : '/dashboard';
      // Only allow internal paths so a tampered iframe can't redirect us off-site.
      if (!path.startsWith('/')) return;
      navigate(path);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [navigate]);
  useEffect(() => {
    if (!inlineHref) { setBytesState('unknown'); return; }
    let cancelled = false;
    setBytesState('unknown');
    fetch(inlineHref, { method: 'HEAD' })
      .then((res) => { if (!cancelled) setBytesState(res.ok ? 'available' : 'unreachable'); })
      .catch(() => { if (!cancelled) setBytesState('unreachable'); });
    return () => { cancelled = true; };
  }, [inlineHref]);

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

  // While the API is determining whether an upload exists, show a branded
  // loading frame rather than a bare spinner — gives the user a visible
  // anchor (country name + flag) instead of a blank screen.
  if (isLoading) {
    return (
      <div className="container px-4 md:px-6 py-16">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-8 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="max-w-xl mx-auto text-center">
          <div className="flex justify-center mb-6 opacity-70">
            <CountryFlag country={displayCountry} size="lg" />
          </div>
          <div className="h-6 w-6 border-2 border-[#D4A017] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Loading {displayCountry}'s PKPB report…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container px-4 md:px-6 py-16">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-8 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="max-w-xl mx-auto text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4 opacity-70" />
          <h1 className="text-2xl font-semibold mb-2">Couldn't load this report</h1>
          <p className="text-gray-400 text-sm">
            The server didn't respond when we tried to fetch {displayCountry}'s PKPB report.
            Refresh the page or try again in a moment.
          </p>
        </div>
      </div>
    );
  }

  // ── PDF on file but no HTML — show the "HTML coming soon" placeholder ────
  // This is the case where a contributor uploaded a PDF (which we can't
  // animate) but no HTML version. The page can't render the report inline
  // with our animations, so we explain that the animated version is on the
  // way and surface the PDF for download.
  if (!htmlDoc && pdfDoc) {
    const pdfDownloadHref = `${DOCS_API}/${pdfDoc.id}/download`;
    const pdfDownloadName = pdfDoc.originalFilename;
    const onPdfDownload = () => {
      const a = document.createElement('a');
      a.href = pdfDownloadHref;
      if (pdfDownloadName) a.download = pdfDownloadName;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
    };
    return (
      <div className="container px-4 md:px-6 py-12 sm:py-16">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-8 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="max-w-xl mx-auto">
          <div
            className="rounded-2xl p-8 sm:p-12 text-center border border-[#D4A017]/20"
            style={{
              background:
                'radial-gradient(circle at 50% 0%, rgba(212,160,23,0.08) 0%, transparent 60%), rgba(255,255,255,0.02)',
            }}
          >
            <ScrollReveal index={0} direction="fade" duration={0.6}>
              <div className="flex justify-center mb-5">
                <CountryFlag country={displayCountry} size="lg" />
              </div>
            </ScrollReveal>

            <ScrollReveal index={1}>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4A017]/10 border border-[#D4A017]/30 text-[#D4A017] text-[10px] font-semibold uppercase tracking-[0.18em] mb-5">
                <Clock className="h-3 w-3" /> HTML edition coming soon
              </div>
            </ScrollReveal>

            <ScrollReveal index={2}>
              <h1
                className="text-3xl sm:text-4xl font-bold mb-3 text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {displayCountry}'s PKPB report<br />is available as a PDF
              </h1>
            </ScrollReveal>

            <ScrollReveal index={3}>
              <p className="text-sm text-gray-400 leading-relaxed max-w-md mx-auto mb-8">
                The animated, interactive HTML edition for {displayCountry} hasn't been
                published yet — the moment a contributor uploads it, this page will
                render their document with the full PACSDA design and animations. In
                the meantime, the PDF is available below.
              </p>
            </ScrollReveal>

            <ScrollReveal index={4}>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/countries')} className="gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Browse other countries
                </Button>
                <Button
                  size="sm"
                  onClick={onPdfDownload}
                  className="gap-1.5"
                  style={{ background: '#C9942A', color: '#0D1B2A' }}
                >
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </Button>
              </div>
            </ScrollReveal>

            <ScrollReveal index={5}>
              <p className="text-[11px] text-gray-500 mt-5 font-mono">
                {pdfDoc.originalFilename}
                {typeof pdfDoc.year === 'number' && ` · ${pdfDoc.year}`}
                {pdfDoc.edition && ` · ${pdfDoc.edition}`}
              </p>
            </ScrollReveal>
          </div>
        </div>
      </div>
    );
  }

  // ── A PKPB document HAS been uploaded ───────────────────────────────────
  // Hold the page on a branded spinner while the HEAD-check is in flight, so
  // we don't briefly flash the "Coming soon" state for a country that does
  // have an upload (the doc's metadata loaded synchronously, but the bytes
  // probe takes another round-trip).
  if (doc && inlineHref && bytesState === 'unknown') {
    return (
      <div className="container px-4 md:px-6 py-16">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-8 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="max-w-xl mx-auto text-center">
          <div className="flex justify-center mb-6 opacity-70">
            <CountryFlag country={displayCountry} size="lg" />
          </div>
          <div className="h-6 w-6 border-2 border-[#D4A017] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Preparing {displayCountry}'s PKPB report…</p>
        </div>
      </div>
    );
  }

  // The bytes can be unreachable even when the metadata is fine — e.g. R2 not
  // configured locally, deleted object, network failure. Show a clear state
  // instead of a silently broken iframe.
  if (doc && inlineHref && bytesState === 'unreachable') {
    return (
      <div className="container px-4 md:px-6 py-16">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-8 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="max-w-xl mx-auto text-center py-8">
          <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4 opacity-80" />
          <h1 className="text-2xl font-semibold mb-2">Document file unreachable</h1>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed max-w-md mx-auto">
            We have the {displayCountry} PKPB record (<span className="font-mono text-xs text-gray-300">{doc.originalFilename}</span>),
            but the file's binary contents aren't accessible from the current backend. This usually means
            object storage (R2/S3) isn't configured for this environment, or the original upload was deleted.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/countries')} className="gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Browse other countries
            </Button>
            <Button size="sm" onClick={handleDownload} className="gap-1.5" style={{ background: '#C9942A', color: '#0D1B2A' }}>
              <Download className="h-3.5 w-3.5" /> Try direct download
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render the document full-screen, exactly as uploaded. The action bar floats
  // at top. We wait until the HEAD-check resolves before painting the iframe so
  // we don't briefly show a 500 page in the frame before swapping to the
  // unreachable state above.
  if (doc && inlineHref && bytesState !== 'unknown') {
    if (isEmbeddable) {
      return (
        // Break out of <main>'s padding and fill the available content area —
        // the dashboard sidebar and topbar own their own layout, we just need
        // to be a tall flex column inside the main slot. Earlier this used
        // `fixed inset-0 lg:left-16 lg:hover:left-60` which had its own hover
        // state that fought the sidebar's hover-expand and covered the topbar.
        <div className="flex flex-col -m-3 sm:-m-4 md:-m-6 min-h-[calc(100dvh-3.5rem)] bg-[#0a0e14]">
          {/* Action bar — slides down from the topbar on entrance */}
          <motion.div
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex-shrink-0 bg-background/95 backdrop-blur border-b border-white/[0.06]"
          >
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
                {/* Download button label tracks the *download* target, not the
                    inline render. When a PDF is on file we ship it (canonical
                    archival format); when only HTML is on file we route through
                    the browser's print-as-PDF dialog. */}
                {(() => {
                  const downloadIsPdf = !!pdfDoc;
                  return (
                    <Button
                      size="sm"
                      onClick={handleDownload}
                      className="gap-2 text-xs"
                      style={{ background: '#C9942A', color: '#0D1B2A' }}
                    >
                      {downloadIsPdf ? <Download className="h-4 w-4" /> : <Printer className="h-4 w-4" />}
                      <span className="hidden sm:inline">{downloadIsPdf ? 'Download PDF' : 'Save as PDF'}</span>
                    </Button>
                  );
                })()}
              </div>
            </div>
          </motion.div>

          {/* PDFs render via <object> with no sandbox — Chrome's built-in PDF
              viewer (PDFium) is reliably blocked by sandboxed iframes, which is
              why the user reported the "blocked by Chrome" page on PDF uploads.
              <object> is the canonical embed for binary content and lets the
              viewer initialize cleanly. PDFs can't run scripts so the sandbox
              wasn't buying us any safety. HTML keeps the sandboxed iframe
              because the contributor's HTML can run its own JS and we want the
              shipped permissions explicit. */}
          {isPdf ? (
            <object
              data={inlineHref}
              type="application/pdf"
              onLoad={() => setIframeLoaded(true)}
              className="flex-1 w-full border-0 bg-white transition-opacity duration-700 ease-out"
              style={{ opacity: iframeLoaded ? 1 : 0 }}
            >
              {/* Fallback shown if the browser can't display the PDF inline at all. */}
              <div className="flex flex-col items-center justify-center h-full text-gray-300 p-8 text-center">
                <FileText className="h-10 w-10 mb-3 opacity-60" />
                <p className="text-sm mb-4">Your browser can't display this PDF inline.</p>
                <Button onClick={handleDownload} className="gap-2" style={{ background: '#C9942A', color: '#0D1B2A' }}>
                  <Download className="h-4 w-4" /> Download {doc.originalFilename}
                </Button>
              </div>
            </object>
          ) : (
            <iframe
              src={inlineHref}
              title={`${doc.title}`}
              onLoad={() => setIframeLoaded(true)}
              className="flex-1 w-full border-0 bg-white transition-opacity duration-700 ease-out"
              style={{ opacity: iframeLoaded ? 1 : 0 }}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          )}
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
  // We deliberately do NOT render the parametric Nigeria-style template here.
  // Each country's PKPB has its own design — until a real document is uploaded,
  // this country has no report to show. "Coming soon" is the accurate state.
  return (
    <div className="container px-4 md:px-6 py-12 sm:py-16">
      <Button variant="outline" onClick={() => navigate(-1)} className="mb-8 gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <div className="max-w-xl mx-auto">
        <div
          className="rounded-2xl p-8 sm:p-12 text-center border border-[#D4A017]/20"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, rgba(212,160,23,0.08) 0%, transparent 60%), rgba(255,255,255,0.02)',
          }}
        >
          <ScrollReveal index={0} direction="fade" duration={0.6}>
            <div className="flex justify-center mb-5">
              <CountryFlag country={displayCountry} size="lg" />
            </div>
          </ScrollReveal>

          <ScrollReveal index={1}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4A017]/10 border border-[#D4A017]/30 text-[#D4A017] text-[10px] font-semibold uppercase tracking-[0.18em] mb-5">
              <Clock className="h-3 w-3" /> Coming soon
            </div>
          </ScrollReveal>

          <ScrollReveal index={2}>
            <h1
              className="text-3xl sm:text-4xl font-bold mb-3 text-white"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {displayCountry}'s PKPB report<br />is on the way
            </h1>
          </ScrollReveal>

          <ScrollReveal index={3}>
            <p className="text-sm text-gray-400 leading-relaxed max-w-md mx-auto mb-8">
              Each Promise Kept · Promise Broken report is independently authored and designed
              for the country it covers. We haven't received {displayCountry}'s edition yet —
              once a contributor uploads it, this page will render their document exactly as
              published, with its own layout and design.
            </p>
          </ScrollReveal>

          <ScrollReveal index={4}>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/countries')} className="gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Browse other countries
              </Button>
              {canUpload && (
                <Link
                  to={`/dashboard/data-upload?country=${encodeURIComponent(countryRef ?? '')}&type=PKPB_REPORT`}
                >
                  <Button size="sm" className="gap-1.5">
                    <UploadIcon className="h-3.5 w-3.5" /> Upload {displayCountry}'s report
                  </Button>
                </Link>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
};

export default PromiseKeptBrokenCountry;
