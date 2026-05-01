import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Share2, ExternalLink, Check, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import CountryFlag from '@/components/CountryFlag';
import { getCountryReport, hasStaticReport, type CountryReport, type Indicator } from '@/data/countryReports';

// ─── Scroll-triggered animation primitives ─────────────────────────
// Fires `inView` true the first time the element enters the viewport,
// then stays true (so animations don't re-replay on scroll-back).
function useInView<T extends Element>(threshold = 0.25): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current || inView) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [inView, threshold]);
  return [ref, inView];
}

// Animated number that counts up to `value` when the parent comes into view.
// Preserves the original formatting (prefix, suffix, decimal places).
const AnimatedNumber: React.FC<{
  value: number;
  active: boolean;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ value, active, duration = 1400, decimals = 0, prefix = '', suffix = '', className, style }) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(eased * value);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, value, duration]);
  const formatted = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString();
  return <span className={className} style={style}>{prefix}{formatted}{suffix}</span>;
};

// Parses a display value like "67.5%", "172/183", "~3.2%", "124M", "931K"
// into { prefix, num, decimals, suffix } so we can animate the numeric part
// while preserving the surrounding characters exactly.
function parseDisplay(val: string): { prefix: string; num: number; decimals: number; suffix: string } {
  const m = val.match(/^([^0-9.\-]*)(-?\d+(?:\.\d+)?)(.*)$/);
  if (!m) return { prefix: '', num: 0, decimals: 0, suffix: val };
  const prefix = m[1] ?? '';
  const numStr = m[2] ?? '0';
  const suffix = m[3] ?? '';
  const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0;
  return { prefix, num: parseFloat(numStr), decimals, suffix };
}

interface Props {
  country: string;
  onBack?: () => void;
  /** If provided, render this report directly instead of looking it up. Used by the PKPB page to inject uploaded data. */
  reportOverride?: CountryReport;
  /** If provided, the Download button hits this URL (e.g. an uploaded PDF in R2) instead of the static HTML report. */
  downloadHref?: string;
  /** Filename to suggest for downloads (only relevant with downloadHref). */
  downloadFilename?: string;
}

// Visual tokens borrowed from the PACSDA report design.
const COLORS = {
  green: '#006B3F',
  greenBright: '#00A854',
  gold: '#C9942A',
  red: '#C0392B',
  navy: '#0D1B2A',
  offWhite: '#F8F6F0',
} as const;

const sevColor = (s: Indicator['severity']) => {
  switch (s) {
    case 'red': return COLORS.red;
    case 'gold': return COLORS.gold;
    case 'green': return COLORS.green;
    case 'navy': return COLORS.navy;
  }
};

const trendIcon = (t: Indicator['trend']) => {
  if (t === 'up-good' || t === 'down-bad') return <TrendingUp className="h-3 w-3" />;
  if (t === 'down-good' || t === 'up-bad') return <TrendingDown className="h-3 w-3" />;
  return <Minus className="h-3 w-3" />;
};

const trendLabel = (t: Indicator['trend']) => {
  if (t === 'up-good') return 'Improving';
  if (t === 'up-bad') return 'Worsening';
  if (t === 'down-good') return 'Improving';
  if (t === 'down-bad') return 'Declining';
  return 'Flat';
};

const legBadge = (s: 'active' | 'partial' | 'weak' | 'new') => {
  const map = {
    active: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Active' },
    partial: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Partial' },
    weak: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', label: 'Weak' },
    new: { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30', label: 'New' },
  } as const;
  const c = map[s];
  return <Badge className={`${c.bg} ${c.text} ${c.border} text-[10px] uppercase tracking-wider`}>{c.label}</Badge>;
};

// Reusable bar — animates fill width and counts the percentage when scrolled into view
const Bar = ({ name, pct, color, valueLabel }: { name: string; pct: number; color: string; valueLabel?: string }) => {
  const [ref, inView] = useInView<HTMLDivElement>(0.4);
  const width = inView ? Math.min(100, pct) : 0;
  return (
    <div ref={ref} className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{name}</span>
        <span className="font-semibold text-gray-200 tabular-nums">
          {valueLabel ?? <AnimatedNumber value={pct} active={inView} decimals={pct % 1 ? 1 : 0} suffix="%" />}
        </span>
      </div>
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${width}%`, background: color, transition: 'width 1.4s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </div>
    </div>
  );
};

// Section header with the document's number + title pattern
const SectionHdr = ({ num, title, tag }: { num: string; title: string; tag?: string }) => (
  <div className="flex items-baseline gap-4 mb-8 pb-4 border-b border-white/[0.08]">
    <span className="font-mono text-xs font-medium tracking-wider" style={{ color: COLORS.gold }}>{num}</span>
    <div>
      <h2 className="font-display text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{title}</h2>
      {tag && <p className="text-xs text-gray-500 mt-1 italic">{tag}</p>}
    </div>
  </div>
);

const CountryReportCard: React.FC<Props> = ({ country, onBack, reportOverride, downloadHref, downloadFilename }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [shareCopied, setShareCopied] = useState(false);

  const report: CountryReport | null = useMemo(
    () => reportOverride ?? getCountryReport(country),
    [country, reportOverride],
  );

  if (!report) {
    return (
      <div className="container px-4 md:px-6 py-12">
        <Button variant="outline" onClick={onBack ?? (() => navigate(-1))} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="text-center py-20 text-gray-400">No report card available for "{country}".</div>
      </div>
    );
  }

  const handleDownload = () => {
    if (downloadHref) {
      // 1a. Uploaded HTML PKPB → open the inline-disposition URL in a new tab,
      // auto-trigger the browser's Print dialog so the user can pick "Save as PDF".
      // This gives contributors an HTML→PDF path with zero server-side conversion.
      const isHtml = !!downloadFilename && /\.(html?|xhtml)$/i.test(downloadFilename);
      if (isHtml) {
        const inlineHref = downloadHref.includes('?')
          ? `${downloadHref}&disposition=inline`
          : `${downloadHref}?disposition=inline`;
        const win = window.open(inlineHref, '_blank');
        if (win) {
          const onLoad = () => { try { win.print(); } catch { /* ignore */ } };
          win.addEventListener('load', onLoad, { once: true });
        } else {
          toast({ title: 'Pop-up blocked', description: 'Allow pop-ups so we can open the HTML report and trigger Save-as-PDF.' });
        }
        return;
      }
      // 1b. Uploaded PDF / DOCX / etc. — direct download via the API stream.
      const a = document.createElement('a');
      a.href = downloadHref;
      if (downloadFilename) a.download = downloadFilename;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }
    // 2. High-fidelity HTML reference (Nigeria's PACSDA print template, bundled).
    if (hasStaticReport(report.country)) {
      const win = window.open(`/reports/${report.country}.html`, '_blank');
      if (win) {
        const onLoad = () => { try { win.print(); } catch { /* ignore */ } };
        win.addEventListener('load', onLoad, { once: true });
      } else {
        toast({ title: 'Pop-up blocked', description: 'Allow pop-ups to download the report card.' });
      }
      return;
    }
    // 3. Nothing uploaded yet for this country.
    toast({
      title: `${report.country} report card — coming soon`,
      description: 'No PKPB report has been uploaded for this country yet. Contributors can upload one from the Contributor Hub.',
    });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/dashboard/countries/${report.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      toast({ title: 'Link copied', description: 'Share this URL to send the report card directly.' });
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      toast({ title: 'Could not copy', description: url, variant: 'destructive' });
    }
  };

  const tierColor = report.ayemiTier === 'Fulfilling' ? COLORS.green : report.ayemiTier === 'Developing' ? COLORS.gold : COLORS.red;

  const [coverRef, coverInView] = useInView<HTMLDivElement>(0.15);
  const [gaugeRef, gaugeInView] = useInView<HTMLDivElement>(0.4);
  const [demoRef, demoInView] = useInView<HTMLDivElement>(0.25);
  const [indicatorsRef, indicatorsInView] = useInView<HTMLDivElement>(0.15);
  const [parliamentRef, parliamentInView] = useInView<HTMLDivElement>(0.3);

  return (
    <div className="min-h-full -m-4 md:-m-6">
      {/* ── Top action bar ── */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-white/[0.06]">
        <div className="container px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={onBack ?? (() => navigate(-1))} className="gap-2 text-xs">
            <ArrowLeft className="h-4 w-4" /> Back to country list
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-2 text-xs">
              {shareCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{shareCopied ? 'Copied' : 'Share'}</span>
            </Button>
            <Button size="sm" onClick={handleDownload} className="gap-2 text-xs" style={{ background: COLORS.gold, color: COLORS.navy }}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download Report Card</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── COVER ── */}
      <section ref={coverRef} className="relative overflow-hidden" style={{ background: COLORS.navy }}>
        <div className="absolute inset-0 opacity-50" style={{
          backgroundImage:
            'radial-gradient(circle at 18% 28%, rgba(0,107,63,0.38) 0%, transparent 52%),' +
            'radial-gradient(circle at 82% 65%, rgba(201,148,42,0.22) 0%, transparent 52%),' +
            'radial-gradient(circle at 55% 8%, rgba(192,57,43,0.18) 0%, transparent 42%)',
        }} />
        <div className="relative container px-4 sm:px-4 sm:px-6 md:px-12 py-8 sm:py-12 md:py-16">
          <div className="flex justify-between items-start gap-3 mb-8 sm:mb-12">
            <div className="min-w-0">
              <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/45 font-medium">PACSDA · AfriYouthStats AYIMS</div>
              <div className="text-[11px] sm:text-xs text-white/65 font-light mt-0.5">Pan African Centre for Social Development and Accountability</div>
            </div>
            <span className="font-mono text-[10px] tracking-wider uppercase font-medium px-2 sm:px-3 py-1 sm:py-1.5 rounded-sm shrink-0" style={{ background: COLORS.gold, color: COLORS.navy }}>{report.edition}</span>
          </div>

          <div className="space-y-4 mb-8 sm:mb-10">
            <div className="flex items-center gap-3">
              <CountryFlag country={report.country} size="lg" />
              <span className="text-[10px] sm:text-xs text-white/40 tracking-[0.2em] uppercase font-medium">{report.country} Country Report Card · Youth Empowerment & Development</span>
            </div>
            <h1 className="font-bold leading-none" style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 7vw, 80px)' }}>
              <span style={{ color: COLORS.greenBright }}>Promise<br />Kept</span>
              <span className="text-white/15 mx-3 align-middle text-[0.55em]">·</span>
              <span style={{ color: '#E74C3C' }}>Promise<br />Broken</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-white/50 font-light max-w-2xl leading-relaxed">
              Implementing the African Youth Charter and the youth lens of Agenda 2063 and the SDGs. A forensic audit of {report.country}'s commitments to its ~{report.totalYouthMillions}M young citizens — evaluated against outcomes.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-8 sm:gap-x-12 gap-y-6 items-end">
            <div>
              <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/40">AYEMI Score 2025</div>
              <AnimatedNumber
                value={report.ayemiScore}
                active={coverInView}
                duration={1800}
                suffix="%"
                className="block font-bold leading-none tabular-nums"
                style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(48px, 12vw, 76px)', color: tierColor }}
              />
              <div className="text-[11px] text-white/30 max-w-xs mt-1 leading-snug">Tier: {report.ayemiTier} · Last reviewed {report.reviewedDate}</div>
            </div>
            <div className="flex flex-col gap-5 pb-1">
              {[
                { num: report.totalYouthMillions, prefix: '~', suffix: 'M', decimals: 0, lbl: `Total youth population 15–35 (of ${report.totalPopMillions}M total)` },
                { num: report.globalYouthDevRank, prefix: '', suffix: `/${report.globalYouthDevTotal}`, decimals: 0, lbl: 'Global Youth Development Index' },
                { num: report.multidimPovertyPct, prefix: '', suffix: '%', decimals: report.multidimPovertyPct % 1 ? 1 : 0, lbl: 'Youth 15–35 in multidim. poverty' },
              ].map((s) => (
                <div key={s.lbl} className="border-l-2 border-white/10 pl-4">
                  <AnimatedNumber
                    value={s.num}
                    active={coverInView}
                    decimals={s.decimals}
                    prefix={s.prefix}
                    suffix={s.suffix}
                    className="font-bold text-white text-xl tabular-nums"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  />
                  <div className="text-[11px] text-white/40 font-light">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Flag stripe */}
        <div className="h-2" style={{ background: `linear-gradient(90deg, ${COLORS.green} 33.33%, white 33.33%, white 66.66%, ${COLORS.green} 66.66%)` }} />
      </section>

      {/* ── 01 EXECUTIVE BRIEF ── */}
      <section className="bg-[#0a0e14] py-10 sm:py-14 md:py-20">
        <div className="container px-4 sm:px-6 md:px-12">
          <SectionHdr num="01" title="Executive Brief" tag={report.ayemiTier === 'Critical' ? 'Score frozen — and a worsening ground reality' : report.ayemiTier === 'Developing' ? 'Mid-band: signals of progress, gaps that persist' : 'Continental leader, with residual gaps'} />
          <p className="text-sm text-gray-400 leading-loose font-light mb-8">{report.executiveBrief}</p>

          <blockquote className="border-l-4 pl-6 my-8 italic text-lg md:text-xl text-white" style={{ borderColor: COLORS.gold, fontFamily: "'Playfair Display', serif" }}>
            "{report.pullQuote}"
          </blockquote>
          <p className="text-sm text-gray-400 leading-loose font-light mb-10">{report.postQuote}</p>

          {/* AYEMI Gauge */}
          <div className="flex flex-col md:flex-row items-center gap-10 mt-8 p-6 md:p-8 bg-white/[0.02] rounded-2xl border border-white/[0.06]">
            <div ref={gaugeRef} className="relative w-[270px] h-[158px] flex-shrink-0">
              <svg viewBox="0 0 200 128" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="gGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={COLORS.red} />
                    <stop offset="50%" stopColor={COLORS.gold} />
                    <stop offset="100%" stopColor={COLORS.green} />
                  </linearGradient>
                  {/* Glow filter for the moving arc tip + needle */}
                  <filter id="gaugeGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Track */}
                <path d="M 20 108 A 80 80 0 0 1 180 108" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="13" strokeLinecap="round" />

                {/* Animated fill — sweeps from left → score%, with glow */}
                <path
                  d="M 20 108 A 80 80 0 0 1 180 108"
                  fill="none"
                  stroke="url(#gGrad)"
                  strokeWidth="13"
                  strokeLinecap="round"
                  strokeDasharray="251"
                  strokeDashoffset={gaugeInView ? 251 - (251 * report.ayemiScore) / 100 : 251}
                  filter="url(#gaugeGlow)"
                  style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
                />

                {/* Needle — rotates around the pivot (100, 108). Synced with the arc:
                    same duration, same easing. The needle points up (90° rotation = +90 score). */}
                <g
                  style={{
                    transformOrigin: '100px 108px',
                    transform: `rotate(${(gaugeInView ? report.ayemiScore : 0) * 1.8 - 90}deg)`,
                    transition: 'transform 1.8s cubic-bezier(0.22, 1, 0.36, 1)',
                    filter: `drop-shadow(0 0 4px ${tierColor}) drop-shadow(0 0 10px ${tierColor}88)`,
                  }}
                >
                  <line x1="100" y1="108" x2="100" y2="40" stroke={tierColor} strokeWidth="2.5" strokeLinecap="round" />
                  {/* Tip cap — pulses gently at the needle end */}
                  <circle cx="100" cy="40" r="3" fill={tierColor}>
                    <animate attributeName="r" values="3;4.5;3" dur="2s" repeatCount="indefinite" begin="1.8s" />
                    <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" begin="1.8s" />
                  </circle>
                </g>

                {/* Pivot disc on top of needle base */}
                <circle cx="100" cy="108" r="6" fill={tierColor} style={{ filter: `drop-shadow(0 0 6px ${tierColor})` }} />
                <circle cx="100" cy="108" r="2.5" fill="rgba(0,0,0,0.4)" />

                <text x="14" y="122" fontSize="8.5" fill="#666" textAnchor="middle" fontFamily="monospace">0</text>
                <text x="100" y="20" fontSize="8.5" fill="#666" textAnchor="middle" fontFamily="monospace">50</text>
                <text x="186" y="122" fontSize="8.5" fill="#666" textAnchor="middle" fontFamily="monospace">100</text>
              </svg>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                <AnimatedNumber
                  value={report.ayemiScore}
                  active={gaugeInView}
                  duration={1800}
                  suffix="%"
                  className="block font-bold text-4xl leading-none tabular-nums"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    color: tierColor,
                    textShadow: gaugeInView ? `0 0 20px ${tierColor}66, 0 0 40px ${tierColor}33` : 'none',
                    transition: 'text-shadow 1.8s ease',
                  }}
                />
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">AYEMI Score</div>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>African Youth Empowerment & Monitoring Index</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-light">
                AYEMI evaluates national delivery across governance, economic inclusion, health, civic participation, legal rights, and digital identity for youth.
              </p>
              <div className="flex gap-4 mt-4 text-[11px]">
                {[
                  { label: '0–33%: Critical', color: COLORS.red },
                  { label: '34–66%: Developing', color: COLORS.gold },
                  { label: '67–100%: Fulfilling', color: COLORS.green },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-1.5 text-gray-500">
                    <div className="w-2 h-2 rounded-full" style={{ background: b.color }} />
                    <span>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 02 DEMOGRAPHICS ── */}
      <section className="bg-background py-10 sm:py-14 md:py-20">
        <div className="container px-4 sm:px-6 md:px-12">
          <SectionHdr num="02" title="Demographic Stakes" tag={`~${report.totalYouthMillions}M youth (15–35) · ${report.youthBulgePct.toFixed(0)}% of adults · median age ${report.medianAge}`} />
          <div ref={demoRef} className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] rounded-xl overflow-hidden mb-10">
            {[
              { num: report.totalYouthMillions, prefix: '~', u: 'M', decimals: 0, label: 'Total youth population 15–35', sub: `Of ${report.totalPopMillions}M total population`, color: 'white' },
              { num: report.youthBulgePct, prefix: '', u: '%', decimals: 0, label: 'Youth bulge (15–29 of adults)', sub: 'NBS / national stats', color: COLORS.greenBright },
              { num: report.medianAge, prefix: '', u: 'yrs', decimals: 1, label: 'Median age', sub: 'Among the youngest globally', color: '#E67E22' },
              { num: report.projectedYouth2050M, prefix: '~', u: 'M', decimals: 0, label: 'Youth projected by 2050', sub: 'UN World Population Prospects', color: '#E74C3C' },
            ].map((c) => (
              <div key={c.label} className="bg-[#0a0e14] p-4 sm:p-6 flex flex-col gap-2">
                <div>
                  <AnimatedNumber
                    value={c.num}
                    active={demoInView}
                    decimals={c.decimals}
                    prefix={c.prefix}
                    className="font-bold text-3xl md:text-4xl leading-none tabular-nums"
                    style={{ fontFamily: "'Playfair Display', serif", color: c.color }}
                  />
                  <span className="text-base font-light text-white/50 ml-1">{c.u}</span>
                </div>
                <div className="text-[11px] text-white/45 uppercase tracking-wider font-medium">{c.label}</div>
                <div className="text-[10px] text-white/30 font-light">{c.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Population age structure</p>
              <div className="space-y-3">
                <Bar name={`Under 15 years`} pct={report.popUnder15Pct} color={COLORS.green} />
                <Bar name={`Youth 15–29 (of adults)`} pct={report.youthBulgePct} color={COLORS.gold} />
                <Bar name={`Urban population`} pct={report.urbanPopPct} color={COLORS.navy === '#0D1B2A' ? '#3b82f6' : COLORS.navy} />
                <Bar name={`Rural poverty rate`} pct={report.ruralPovertyPct} color={COLORS.red} />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Youth poverty & food security</p>
              <div className="space-y-3">
                <Bar name="Youth 15–35 in multidim. poverty" pct={report.multidimPovertyPct} color={COLORS.red} />
                <Bar name="Overall poverty rate" pct={report.overallPovertyPct} color={COLORS.red} />
                <Bar name="Youth below national poverty line" pct={report.belowNatPovertyPct} color={COLORS.red} />
                <Bar name="Food insecurity moderate–severe" pct={report.foodInsecurityPct} color={COLORS.gold} />
                <Bar name="Informal employment" pct={report.informalEmploymentPct} color={COLORS.gold} />
              </div>
              <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(192,57,43,0.12)', borderLeft: `4px solid ${COLORS.red}` }}>
                <p className="text-xs text-gray-300 leading-relaxed"><span className="font-semibold" style={{ color: '#FF8080' }}>Poverty surge:</span> {report.povertyInsight}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 03 PROMISE SPLIT ── */}
      <section className="grid md:grid-cols-2">
        <div className="p-5 sm:p-8 md:p-14" style={{ background: '#2D1B4E', color: 'white' }}>
          <div className="flex items-center gap-3 mb-6 sm:mb-9">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0" style={{ background: 'rgba(180,130,255,0.25)' }}>✓</div>
            <div className="min-w-0">
              <div className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Promise Kept</div>
              <div className="text-[10px] tracking-widest uppercase text-white/40 mt-1">Forensic · Youth-specific · Evidence-grounded</div>
            </div>
          </div>
          <div className="space-y-4">
            {report.promiseKept.map((p) => (
              <div key={p.title} className="flex gap-3 p-4 rounded border" style={{ background: 'rgba(167,139,250,0.10)', borderColor: 'rgba(167,139,250,0.25)' }}>
                <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: '#A78BFA' }} />
                <div>
                  <div className="text-sm font-semibold mb-1 leading-snug">{p.title}</div>
                  <div className="text-[11px] text-white/75 font-light leading-relaxed">{p.desc}</div>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-sm font-mono text-[9px] tracking-wider" style={{ background: 'rgba(167,139,250,0.22)', color: '#C4B5FD' }}>{p.stat}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 sm:p-8 md:p-14" style={{ background: '#190808', color: 'white' }}>
          <div className="flex items-center gap-3 mb-6 sm:mb-9">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0" style={{ background: 'rgba(192,57,43,0.45)' }}>✗</div>
            <div className="min-w-0">
              <div className="text-2xl sm:text-3xl font-bold" style={{ color: '#E74C3C', fontFamily: "'Playfair Display', serif" }}>Promise Broken</div>
              <div className="text-[10px] tracking-widest uppercase text-white/40 mt-1">Where commitments met reality — and failed</div>
            </div>
          </div>
          <div className="space-y-4">
            {report.promiseBroken.map((p) => (
              <div key={p.title} className="flex gap-3 p-4 rounded border" style={{ background: 'rgba(192,57,43,0.10)', borderColor: 'rgba(192,57,43,0.18)' }}>
                <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: '#E74C3C' }} />
                <div>
                  <div className="text-sm font-semibold mb-1 leading-snug">{p.title}</div>
                  <div className="text-[11px] text-white/75 font-light leading-relaxed">{p.desc}</div>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-sm font-mono text-[9px] tracking-wider" style={{ background: 'rgba(192,57,43,0.30)', color: '#FF8080' }}>{p.stat}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 04 KEY INDICATORS ── */}
      <section className="bg-[#0a0e14] py-10 sm:py-14 md:py-20">
        <div className="container px-4 sm:px-6 md:px-12">
          <SectionHdr num="04" title="Key Indicators at a Glance" tag={`The data points that define ${report.country}'s youth situation in 2025`} />
          <div ref={indicatorsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {report.indicators.map((ind, i) => {
              const c = sevColor(ind.severity);
              const trendBg = ind.trend.endsWith('-bad') ? 'bg-red-500/10 text-red-400' : ind.trend.endsWith('-good') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400';
              const parsed = parseDisplay(ind.value);
              return (
                <div
                  key={ind.topic}
                  className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-2.5 transition-all hover:border-white/[0.15] hover:bg-white/[0.05] hover:-translate-y-0.5"
                  style={{
                    opacity: indicatorsInView ? 1 : 0,
                    transform: indicatorsInView ? 'translateY(0)' : 'translateY(16px)',
                    transition: `opacity 0.6s ease ${i * 60}ms, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${i * 60}ms`,
                  }}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">{ind.topic}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${trendBg}`}>
                      {trendIcon(ind.trend)} {trendLabel(ind.trend)}
                    </span>
                  </div>
                  <AnimatedNumber
                    value={parsed.num}
                    active={indicatorsInView}
                    decimals={parsed.decimals}
                    prefix={parsed.prefix}
                    suffix={parsed.suffix}
                    className="font-bold text-3xl leading-none tabular-nums"
                    style={{ fontFamily: "'Playfair Display', serif", color: c }}
                  />
                  <div className="text-xs text-gray-300 leading-snug">{ind.label}</div>
                  <div className="text-[11px] text-gray-500 italic">{ind.compare}</div>
                  <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: indicatorsInView ? `${Math.min(100, ind.barPct)}%` : '0%',
                        background: c,
                        transition: `width 1.4s cubic-bezier(0.22, 1, 0.36, 1) ${i * 60 + 200}ms`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 05 GOVERNANCE ── */}
      <section className="bg-background py-10 sm:py-14 md:py-20">
        <div className="container px-4 sm:px-6 md:px-12">
          <SectionHdr num="05" title="The Governance Gap" tag="Young, registered, and structurally excluded" />
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Parliament — {report.parliamentSeats} seats</p>
              <div ref={parliamentRef} className="grid gap-1 p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]" style={{ gridTemplateColumns: 'repeat(20, 1fr)' }}>
                {Array.from({ length: report.parliamentSeats }).map((_, i) => {
                  const isYouth = i < report.youthSeats;
                  return (
                    <div
                      key={i}
                      className="aspect-square rounded-full"
                      style={{
                        background: parliamentInView
                          ? (isYouth ? COLORS.green : 'rgba(255,255,255,0.06)')
                          : 'rgba(255,255,255,0.02)',
                        opacity: parliamentInView ? 1 : 0,
                        // Stagger by seat — youth seats first, then non-youth
                        transition: `background 0.4s ease ${(isYouth ? i * 30 : 600 + (i - report.youthSeats) * 2)}ms, opacity 0.4s ease ${(isYouth ? i * 30 : 600 + (i - report.youthSeats) * 2)}ms`,
                      }}
                    />
                  );
                })}
              </div>
              <div className="flex gap-5 mt-3 text-xs text-gray-400">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: COLORS.green }} /> Youth (25–35): {report.youthSeats} ({((report.youthSeats / report.parliamentSeats) * 100).toFixed(2)}%)</span>
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-white/10" /> Non-youth: {report.parliamentSeats - report.youthSeats}</span>
              </div>

              <div className="mt-8 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Youth electoral energy vs. structural outcome</p>
                <Bar name="New voter registrants who are youth" pct={report.voterRegYouthPct} color={COLORS.green} />
                <Bar name="Youth on total voter register" pct={report.totalVoterYouthPct} color={COLORS.greenBright} />
                <Bar name="Youth candidates in last election" pct={report.candidatesYouthPct} color={COLORS.gold} />
                <Bar name="Youth seats in parliament" pct={(report.youthSeats / report.parliamentSeats) * 100} color={COLORS.red} valueLabel={`${((report.youthSeats / report.parliamentSeats) * 100).toFixed(2)}%`} />
              </div>
            </div>
            <div className="space-y-6">
              <p className="text-sm text-gray-400 leading-loose font-light">{report.govNarrative}</p>
              <div className="pb-5 border-b border-white/[0.06]">
                <div className="flex items-baseline gap-3">
                  <span className="font-bold text-3xl" style={{ fontFamily: "'Playfair Display', serif", color: COLORS.red }}>{report.pressFreedomRank}<span className="text-lg text-gray-500">/{report.pressFreedomTotal}</span></span>
                  <span className="text-xs text-gray-400">RSF Press Freedom Rank</span>
                </div>
                <p className="text-xs text-gray-500 italic mt-2 leading-relaxed">Press freedom shapes youth civic voice and accountability reporting capacity.</p>
              </div>
              <div className="pb-5 border-b border-white/[0.06]">
                <div className="flex items-baseline gap-3">
                  <span className="font-bold text-3xl" style={{ fontFamily: "'Playfair Display', serif", color: COLORS.gold }}>{report.candidatesYouthPct}%</span>
                  <span className="text-xs text-gray-400">youth candidates in last election</span>
                </div>
                <p className="text-xs text-gray-500 italic mt-2 leading-relaxed">Nomination cost barriers structurally exclude youth regardless of age eligibility reforms.</p>
              </div>
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="font-bold text-3xl" style={{ fontFamily: "'Playfair Display', serif", color: COLORS.navy }}>~{report.civicDigEngagement}</span>
                  <span className="text-xs text-gray-400">civic digital engagement per 100K</span>
                </div>
                <p className="text-xs text-gray-500 italic mt-2 leading-relaxed">A generation tuning out of formal channels and into informal civic spaces.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 06 EDUCATION & BRAIN DRAIN ── */}
      <section className="py-10 sm:py-14 md:py-20" style={{ background: COLORS.navy }}>
        <div className="container px-4 sm:px-6 md:px-12">
          <SectionHdr num="06" title="Education & the Brain Drain Crisis" tag={`${report.tertiaryGerPct}% tertiary GER · ${report.literacyPct}% literacy · ${report.brainDrainPct}% emigrating annually`} />
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {[
              { v: `${report.literacyPct}%`, label: `Functional literacy (youth 15–35) — ${(100 - report.literacyPct).toFixed(0)}% functionally illiterate`, color: COLORS.gold, bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
              { v: `${report.tertiaryGerPct}%`, label: 'Tertiary Gross Enrolment Ratio — SDG 4 progress at risk', color: '#FF8080', bg: 'rgba(192,57,43,0.18)', border: 'rgba(192,57,43,0.3)' },
              { v: `~${report.internetAccessPct}%`, label: 'Youth 15–35 with internet access — digital exclusion compounds every gap', color: '#80CFFF', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg p-4 sm:p-6" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <div className="font-bold text-4xl sm:text-5xl leading-none" style={{ fontFamily: "'Playfair Display', serif", color: s.color }}>{s.v}</div>
                <div className="text-xs text-white/55 mt-2 leading-relaxed">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-4">
              {[
                { num: `~${report.brainDrainPct}%`, title: 'Net youth emigration rate per year', desc: `Skilled, educated, digitally capable youth represent the majority of those emigrating from ${report.country}.` },
                { num: `${report.passportPct}%`, title: 'Passport coverage nationally', desc: `Mobility access is concentrated in the educated, urban, connected youth — already disproportionately leaving.` },
                { num: `${report.bilateralDegreeAgrs}`, title: 'Bilateral degree equivalence agreements', desc: `Asset for youth graduate mobility under AfCFTA and regional frameworks. Outward mobility should be matched with retention strategies.` },
              ].map((d) => (
                <div key={d.title} className="flex gap-5 p-5 rounded-md" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span className="font-bold text-3xl flex-shrink-0 min-w-[80px]" style={{ fontFamily: "'Playfair Display', serif", color: COLORS.gold }}>{d.num}</span>
                  <div>
                    <div className="text-sm font-semibold text-white">{d.title}</div>
                    <div className="text-xs text-white/45 mt-1 font-light leading-relaxed">{d.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">Education access by level</p>
              <div className="space-y-3">
                <Bar name="Functional literacy 15–35" pct={report.literacyPct} color={COLORS.gold} />
                <Bar name="Secondary completion (est.)" pct={report.secondaryCompletionPct} color="rgba(201,148,42,0.6)" />
                <Bar name="Tertiary GER" pct={report.tertiaryGerPct} color={COLORS.red} />
                <Bar name="Youth with internet access" pct={report.internetAccessPct} color="#C0392B" />
              </div>
              <div className="mt-5 p-4 rounded-md" style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.25)' }}>
                <p className="text-xs text-white/70 leading-relaxed">
                  <span className="font-semibold" style={{ color: '#FF8080' }}>Compounding failure:</span> A young person with literacy but no internet access, tertiary opportunity, or passport cannot compete in the digital economy. Emigration or informality become rational choices, not preferences.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 07 HEALTH ── */}
      <section className="bg-background py-10 sm:py-14 md:py-20">
        <div className="container px-4 sm:px-6 md:px-12">
          <SectionHdr num="07" title="Youth Health: Compounding Burdens" tag="HIV, mental health, child marriage, and a system under-resourced for youth" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[
              { v: `${report.hivYouthSharePct}%`, label: 'New HIV infections in youth 15–24', sub: 'Young women bear the higher prevalence', bg: COLORS.red },
              { v: `${report.mentalHealthBurdenPct}%`, label: 'Youth with moderate–severe mental health indicators', sub: 'No dedicated federal programme', bg: '#8B2500' },
              { v: `${report.childMarriageAge}yrs`, label: 'Average child marriage age', sub: 'Sub-national domestication uneven', bg: '#4A0060' },
              { v: report.artCount, label: 'On antiretroviral therapy in donor-supported states', sub: 'Genuine programme achievement', bg: COLORS.green },
              { v: report.hivWomen, label: 'New HIV infections in young women annually', sub: 'Gender gap driven by structural inequality', bg: COLORS.navy },
              { v: `${report.unmetContraceptionPct}%`, label: 'Unmet contraception need (adolescent girls)', sub: 'Elevated adolescent birth rate', bg: '#1a3540' },
            ].map((c) => (
              <div key={c.label} className="p-5 rounded-lg text-white" style={{ background: c.bg }}>
                <div className="font-bold text-3xl leading-none mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{c.v}</div>
                <div className="text-[11px] text-white/65 leading-relaxed font-light">{c.label}</div>
                <div className="text-[10px] text-white/35 italic mt-1.5">{c.sub}</div>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">HIV testing coverage (youth 15–19)</p>
              <div className="space-y-3">
                <Bar name="Girls tested in past year" pct={report.hivTestGirlsPct} color={COLORS.red} />
                <Bar name="Boys tested in past year" pct={report.hivTestBoysPct} color={COLORS.red} />
              </div>
              <div className="mt-4 p-4 rounded-md" style={{ background: 'rgba(192,57,43,0.12)', borderLeft: `4px solid ${COLORS.red}` }}>
                <p className="text-xs text-gray-300 leading-relaxed"><span className="font-semibold" style={{ color: '#FF8080' }}>Testing gap:</span> Adolescent testing coverage is too low to interrupt transmission. The prevention pipeline is structurally broken at point of entry.</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Mental health & child protection</p>
              <div className="space-y-3">
                <Bar name="Youth with moderate–severe MH indicators" pct={report.mentalHealthBurdenPct} color={COLORS.gold} />
                <Bar name="Child Rights Act domestication" pct={report.childRightsActStates.includes('/') ? (parseInt(report.childRightsActStates.split('/')[0]) / parseInt(report.childRightsActStates.split('/')[1])) * 100 : 70} color={COLORS.gold} valueLabel={report.childRightsActStates} />
              </div>
              <div className="mt-4 p-4 rounded-md" style={{ background: 'rgba(201,148,42,0.10)', borderLeft: `4px solid ${COLORS.gold}` }}>
                <p className="text-xs text-gray-300 leading-relaxed"><span className="font-semibold" style={{ color: COLORS.gold }}>Invisible burden:</span> A growing share of young people carries mental health burden with no pathway to publicly funded support — the silent multiplier behind dropout, unemployment, and emigration data.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 08 DIGITAL IDENTITY ── */}
      <section className="bg-[#0a0e14] py-10 sm:py-14 md:py-20">
        <div className="container px-4 sm:px-6 md:px-12">
          <SectionHdr num="08" title="Digital Identity & Data Rights" tag="Building the citizenship infrastructure — and the gaps that remain" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { v: `${report.digitalIdMillions}M`, label: 'National IDs issued', sub: `${((report.digitalIdMillions / report.digitalIdTargetMillions) * 100).toFixed(0)}% of ${report.digitalIdTargetMillions}M target`, color: COLORS.gold, bg: COLORS.navy, prog: (report.digitalIdMillions / report.digitalIdTargetMillions) * 100 },
              { v: `${report.bankedMillions.toFixed(1)}M`, label: 'Banked population', sub: `~${report.bankedPct}% of population`, color: 'white', bg: COLORS.green, prog: report.bankedPct },
              { v: `${report.passportPct}%`, label: 'Passport coverage', sub: 'Mobility severely restricted', color: '#FF8080', bg: '#6B1C1C', prog: report.passportPct },
              { v: `~${report.noFormalIdPct}%`, label: 'Population without formal ID', sub: 'Rural women, IDPs, elderly', color: '#9999FF', bg: '#1C1C6B', prog: report.noFormalIdPct },
            ].map((m) => (
              <div key={m.label} className="rounded-lg p-4 sm:p-5 text-white" style={{ background: m.bg }}>
                <div className="font-bold text-2xl sm:text-3xl leading-none" style={{ fontFamily: "'Playfair Display', serif", color: m.color }}>{m.v}</div>
                <div className="text-[11px] text-white/45 uppercase tracking-wider mt-2">{m.label}</div>
                <div className="text-[10px] text-white/30 font-light mt-0.5">{m.sub}</div>
                <div className="h-1 bg-white/10 rounded mt-3 overflow-hidden">
                  <div className="h-full" style={{ width: `${Math.min(100, m.prog)}%`, background: m.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-lg p-6" style={{ background: COLORS.navy }}>
              <div className="flex items-center gap-3 mb-3">
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-[10px] tracking-wider">NEW · {report.ndpaYear}</Badge>
                <span className="text-sm font-semibold text-white">Data Protection Act ({report.ndpaYear})</span>
              </div>
              <p className="text-xs text-white/55 leading-relaxed font-light">
                Enforceable digital rights for youth in gig, fintech, and social platform contexts. Data protection officers and digital governance roles create a compliance economy — a concrete youth employment pathway if professional training pipelines are developed alongside the law.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Identity coverage by cohort</p>
              <div className="space-y-3">
                <Bar name="National IDs toward target" pct={(report.digitalIdMillions / report.digitalIdTargetMillions) * 100} color={COLORS.green} />
                <Bar name="Banked population coverage" pct={report.bankedPct} color={COLORS.green} />
                <Bar name="Passport coverage" pct={report.passportPct} color={COLORS.red} />
                <Bar name="Internet access (youth 15–35)" pct={report.internetAccessPct} color={COLORS.red} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 09 LEGISLATIVE SCORECARD ── */}
      <section className="bg-background py-10 sm:py-14 md:py-20">
        <div className="container px-4 sm:px-6 md:px-12">
          <SectionHdr num="09" title="Legislative Scorecard" tag="Laws on paper versus outcomes on the ground" />
          <p className="text-sm text-gray-400 leading-loose font-light mb-8">
            {report.country} possesses a layered youth statutory framework. The analysis below assesses each instrument by its youth-specific implementation reality.
          </p>
          <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: COLORS.navy }}>
                  <th className="text-left px-4 py-3 text-[10px] tracking-wider uppercase text-white/65 font-medium">Legislation / Instrument</th>
                  <th className="text-left px-4 py-3 text-[10px] tracking-wider uppercase text-white/65 font-medium">Year</th>
                  <th className="text-left px-4 py-3 text-[10px] tracking-wider uppercase text-white/65 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] tracking-wider uppercase text-white/65 font-medium">Youth-Specific Reality</th>
                </tr>
              </thead>
              <tbody>
                {report.legislation.map((l, i) => (
                  <tr key={l.name} className={`border-b border-white/[0.04] ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="px-4 py-3 align-top font-semibold text-gray-200 text-xs">{l.name}</td>
                    <td className="px-4 py-3 align-top text-gray-500 text-xs">{l.year}</td>
                    <td className="px-4 py-3 align-top">{legBadge(l.status)}</td>
                    <td className="px-4 py-3 align-top text-xs text-gray-400 leading-relaxed">{l.reality}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 10 RECOMMENDATIONS ── */}
      <section className="py-10 sm:py-14 md:py-20" style={{ background: COLORS.navy }}>
        <div className="container px-4 sm:px-6 md:px-12">
          <SectionHdr num="10" title="Priorities for a New Compact" tag="Structural, measurable, and time-bound commitments for 2026–2027" />
          <div className="grid md:grid-cols-2 gap-5">
            {report.recommendations.map((r) => (
              <div key={r.num} className="p-6 rounded-lg flex gap-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="font-bold text-4xl flex-shrink-0 leading-none" style={{ fontFamily: "'Playfair Display', serif", color: 'rgba(255,255,255,0.08)' }}>{r.num}</span>
                <div>
                  <div className="text-sm font-semibold mb-2" style={{ color: COLORS.gold }}>{r.title}</div>
                  <div className="text-xs text-white/55 leading-relaxed font-light">{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-10 sm:py-14 md:py-20 text-center" style={{ background: COLORS.gold }}>
        <div className="container px-4 sm:px-6 md:px-12 max-w-3xl mx-auto">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-black/45 mb-3">Call to Action · Donor & Partnership Engagement</div>
          <h2 className="font-bold text-2xl sm:text-3xl md:text-4xl mb-4 leading-tight" style={{ color: COLORS.navy, fontFamily: "'Playfair Display', serif" }}>
            Invest in the Annual<br />{report.country} Youth Report Card
          </h2>
          <p className="text-sm text-black/60 leading-relaxed font-light mb-8">
            Part of PACSDA's multi-year AYIMS monitoring programme — independent, evidence-based, youth-forensic tracking for {report.country}'s AYC and SDG obligations. Sustained donor investment enables annual data, independent verification, sub-national disaggregation, and policy advocacy.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="https://pacsda.org/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3 rounded text-sm font-semibold tracking-wide hover:opacity-90 transition-opacity"
              style={{ background: COLORS.navy, color: 'white' }}
            >
              Partner with PACSDA <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-7 py-3 rounded text-sm font-semibold tracking-wide border-2 hover:bg-black/5 transition-colors"
              style={{ color: COLORS.navy, borderColor: COLORS.navy }}
            >
              Access AYIMS Platform
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 md:py-14 px-4 sm:px-6 md:px-12 flex flex-col md:flex-row justify-between gap-4" style={{ background: COLORS.navy, borderTop: `4px solid ${COLORS.green}` }}>
        <div>
          <div className="text-sm text-white/65 font-medium">Pan African Centre for Social Development and Accountability</div>
          <div className="font-mono text-[10px] tracking-wider text-white/30 mt-1">PACSDA · AfriYouthStats AYIMS · {report.edition} · Last reviewed {report.reviewedDate}</div>
        </div>
        <div className="text-xs text-white/30 leading-relaxed md:text-right">
          <div><a href="http://www.pacsda.org/yims" className="hover:underline" style={{ color: COLORS.gold }}>www.pacsda.org/yims</a></div>
          <div><a href="mailto:afriyouthstats@pacsda.org" className="hover:underline" style={{ color: COLORS.gold }}>afriyouthstats@pacsda.org</a></div>
          <div className="text-white/40 mt-0.5">Mr Obinna Okehie · AfriYouthStats Hub</div>
          <div className="text-white/40">Next full review: {report.nextReview}</div>
        </div>
      </footer>
    </div>
  );
};

export default CountryReportCard;
