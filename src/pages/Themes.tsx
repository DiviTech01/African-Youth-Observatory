import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Content } from '@/components/cms';
import {
  Users,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Rocket,
  Vote,
  Cpu,
  Wheat,
  Scale,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

// ── Per-theme accent palette + secondary icon (the "decoration") ──
type ThemeKey =
  | 'population' | 'education' | 'health' | 'employment'
  | 'entrepreneurship' | 'civic-engagement'
  | 'innovation-technology' | 'agriculture' | 'gender-equality';

interface ThemeStat { slug: string; label: string; value: number; suffix?: string; prefix?: string; decimals?: number; }
interface ThemeDef {
  id: ThemeKey;
  title: string;
  description: string;
  icon: React.ElementType;
  accent: { from: string; to: string; ring: string; glow: string; tint: string };
  stats: ThemeStat[];
}

const themes: ThemeDef[] = [
  {
    id: 'population',
    title: 'Population',
    description: 'Demographics, age structure, and growth trends across the continent.',
    icon: Users,
    accent: { from: '#10b981', to: '#34d399', ring: '#10b98140', glow: 'rgba(16,185,129,0.25)', tint: 'rgba(16,185,129,0.08)' },
    stats: [
      { slug: 'total', label: 'Total Youth', value: 226, suffix: 'M' },
      { slug: 'growth', label: 'Annual Growth', value: 2.3, suffix: '%', decimals: 1 },
      { slug: 'urban', label: 'Urban Youth', value: 43, suffix: '%' },
    ],
  },
  {
    id: 'education',
    title: 'Education',
    description: 'Literacy, enrolment, and learning outcomes for young Africans.',
    icon: GraduationCap,
    accent: { from: '#3b82f6', to: '#60a5fa', ring: '#3b82f640', glow: 'rgba(59,130,246,0.25)', tint: 'rgba(59,130,246,0.08)' },
    stats: [
      { slug: 'literacy', label: 'Literacy', value: 73.4, suffix: '%', decimals: 1 },
      { slug: 'secondary', label: 'Secondary', value: 62.7, suffix: '%', decimals: 1 },
      { slug: 'tertiary', label: 'Tertiary', value: 17.8, suffix: '%', decimals: 1 },
    ],
  },
  {
    id: 'health',
    title: 'Health',
    description: 'Healthcare access, mental wellbeing, and outcomes for the youth cohort.',
    icon: HeartPulse,
    accent: { from: '#a855f7', to: '#c084fc', ring: '#a855f740', glow: 'rgba(168,85,247,0.25)', tint: 'rgba(168,85,247,0.08)' },
    stats: [
      { slug: 'access', label: 'Access', value: 67.2, suffix: '%', decimals: 1 },
      { slug: 'insurance', label: 'Insured', value: 38.5, suffix: '%', decimals: 1 },
      { slug: 'mental', label: 'MH Services', value: 27.3, suffix: '%', decimals: 1 },
    ],
  },
  {
    id: 'employment',
    title: 'Employment',
    description: 'Labour market participation, formal-vs-informal balance, and job creation.',
    icon: Briefcase,
    accent: { from: '#f97316', to: '#fb923c', ring: '#f9731640', glow: 'rgba(249,115,22,0.25)', tint: 'rgba(249,115,22,0.08)' },
    stats: [
      { slug: 'unemployment', label: 'Unemployment', value: 19.7, suffix: '%', decimals: 1 },
      { slug: 'participation', label: 'LFPR', value: 41.3, suffix: '%', decimals: 1 },
      { slug: 'informal', label: 'Informal', value: 72.8, suffix: '%', decimals: 1 },
    ],
  },
  {
    id: 'entrepreneurship',
    title: 'Entrepreneurship',
    description: 'Startup ecosystems, business ownership, and access to capital.',
    icon: Rocket,
    accent: { from: '#14b8a6', to: '#5eead4', ring: '#14b8a640', glow: 'rgba(20,184,166,0.25)', tint: 'rgba(20,184,166,0.08)' },
    stats: [
      { slug: 'ownership', label: 'Ownership', value: 12.6, suffix: '%', decimals: 1 },
      { slug: 'finance', label: 'Finance Access', value: 23.4, suffix: '%', decimals: 1 },
      { slug: 'startup', label: 'Startup Rate', value: 3.2, suffix: '%', decimals: 1 },
    ],
  },
  {
    id: 'civic-engagement',
    title: 'Civic Engagement',
    description: 'Youth in governance, voting, civil society, and political agency.',
    icon: Vote,
    accent: { from: '#ef4444', to: '#f87171', ring: '#ef444440', glow: 'rgba(239,68,68,0.25)', tint: 'rgba(239,68,68,0.08)' },
    stats: [
      { slug: 'voter', label: 'Voter Reg.', value: 42.8, suffix: '%', decimals: 1 },
      { slug: 'parliament', label: 'In Parliament', value: 3.2, suffix: '%', decimals: 1 },
      { slug: 'cso', label: 'CSOs', value: 12400, suffix: '+' },
    ],
  },
  {
    id: 'innovation-technology',
    title: 'Innovation & Tech',
    description: 'Digital adoption, STEM pipelines, and technological capability.',
    icon: Cpu,
    accent: { from: '#06b6d4', to: '#67e8f9', ring: '#06b6d440', glow: 'rgba(6,182,212,0.25)', tint: 'rgba(6,182,212,0.08)' },
    stats: [
      { slug: 'internet', label: 'Internet', value: 33.8, suffix: '%', decimals: 1 },
      { slug: 'mobile', label: 'Mobile', value: 67.2, suffix: '%', decimals: 1 },
      { slug: 'stem', label: 'STEM', value: 14.5, suffix: '%', decimals: 1 },
    ],
  },
  {
    id: 'agriculture',
    title: 'Agriculture',
    description: 'Youth in farming, land access, and rural food systems.',
    icon: Wheat,
    accent: { from: '#eab308', to: '#fde047', ring: '#eab30840', glow: 'rgba(234,179,8,0.25)', tint: 'rgba(234,179,8,0.08)' },
    stats: [
      { slug: 'youth_in_ag', label: 'In Agriculture', value: 28.4, suffix: '%', decimals: 1 },
      { slug: 'land', label: 'Land Access', value: 12.1, suffix: '%', decimals: 1 },
      { slug: 'productivity', label: 'Productivity', value: 62.3, decimals: 1 },
    ],
  },
  {
    id: 'gender-equality',
    title: 'Gender Equality',
    description: 'Parity in education, work, leadership, and protection from violence.',
    icon: Scale,
    accent: { from: '#ec4899', to: '#f9a8d4', ring: '#ec489940', glow: 'rgba(236,72,153,0.25)', tint: 'rgba(236,72,153,0.08)' },
    stats: [
      { slug: 'gpi_edu', label: 'GPI Edu', value: 0.94, decimals: 2 },
      { slug: 'workforce', label: 'Workforce', value: 38.7, suffix: '%', decimals: 1 },
      { slug: 'gbv', label: 'GBV', value: 21.3, suffix: '%', decimals: 1 },
    ],
  },
];

const themeSlug = (id: string) => id.replace(/-/g, '_');

// ── Animation primitives ──
function useInView<T extends Element>(threshold = 0.2): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current || inView) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [inView, threshold]);
  return [ref, inView];
}

const AnimatedNum: React.FC<{
  value: number; active: boolean; duration?: number; decimals?: number; prefix?: string; suffix?: string;
}> = ({ value, active, duration = 1400, decimals = 0, prefix = '', suffix = '' }) => {
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
  const formatted =
    decimals > 0
      ? n.toFixed(decimals)
      : Math.round(n).toLocaleString();
  return <>{prefix}{formatted}{suffix}</>;
};

// ── Card ──
const ThemeCard: React.FC<{ theme: ThemeDef; index: number }> = ({ theme, index }) => {
  const [ref, inView] = useInView<HTMLDivElement>(0.18);
  const Icon = theme.icon;
  const slug = themeSlug(theme.id);

  return (
    <Link
      to={`/explore?theme=${theme.id}`}
      ref={ref as any}
      className="group relative block rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.06] p-5 hover:-translate-y-1 transition-all duration-300"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.55s ease ${index * 60}ms, transform 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${index * 60}ms, box-shadow 0.3s ease`,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 36px -8px ${theme.accent.glow}, 0 0 0 1px ${theme.accent.ring}`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
    >
      {/* Soft gradient corner glow */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-40 group-hover:opacity-70 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle, ${theme.accent.glow} 0%, transparent 70%)` }}
      />

      {/* Icon medallion */}
      <div className="relative inline-flex mb-4">
        {/* Animated rotating ring */}
        <svg width="60" height="60" viewBox="0 0 60 60" className="absolute inset-0 -m-1">
          <defs>
            <linearGradient id={`g-${theme.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.accent.from} />
              <stop offset="100%" stopColor={theme.accent.to} />
            </linearGradient>
          </defs>
          <circle
            cx="30"
            cy="30"
            r="27"
            fill="none"
            stroke={`url(#g-${theme.id})`}
            strokeWidth="1.5"
            strokeDasharray="4 6"
            strokeLinecap="round"
            style={{
              transformOrigin: '30px 30px',
              animation: 'theme-ring-spin 14s linear infinite',
            }}
          />
        </svg>
        <div
          className="relative w-[52px] h-[52px] rounded-xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${theme.accent.from}, ${theme.accent.to})`,
            boxShadow: `0 8px 24px -6px ${theme.accent.glow}, inset 0 1px 0 rgba(255,255,255,0.18)`,
          }}
        >
          <Icon className="h-6 w-6 text-white drop-shadow" />
          <Sparkles
            className="absolute -top-1 -right-1 h-3 w-3 text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))' }}
          />
        </div>
      </div>

      {/* Title + description */}
      <Content
        as="h3"
        id={`themes.${slug}.title`}
        fallback={theme.title}
        className="text-lg font-semibold text-white tracking-tight"
      />
      <Content
        as="p"
        id={`themes.${slug}.description`}
        fallback={theme.description}
        className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2"
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {theme.stats.map((stat) => (
          <div
            key={stat.slug}
            className="rounded-lg px-2 py-2 border border-white/[0.05]"
            style={{ background: theme.accent.tint }}
          >
            <div
              className="text-base font-bold tabular-nums leading-none"
              style={{
                background: `linear-gradient(135deg, ${theme.accent.from}, ${theme.accent.to})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              <AnimatedNum
                value={stat.value}
                active={inView}
                decimals={stat.decimals ?? 0}
                prefix={stat.prefix}
                suffix={stat.suffix}
              />
            </div>
            <Content
              as="div"
              id={`themes.${slug}.stat.${stat.slug}.label`}
              fallback={stat.label}
              className="text-[9px] uppercase tracking-wider text-gray-500 mt-1 truncate"
            />
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-gray-500 group-hover:text-white transition-colors">
          Explore data
        </span>
        <ArrowRight
          className="h-3.5 w-3.5 text-gray-500 group-hover:translate-x-1 transition-all"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        />
      </div>

      {/* Bottom accent line that grows on hover */}
      <div
        className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500"
        style={{ background: `linear-gradient(90deg, ${theme.accent.from}, ${theme.accent.to})` }}
      />
    </Link>
  );
};

const Themes: React.FC = () => {
  const { t } = useLanguage();
  return (
    <>
      <style>{`
        @keyframes theme-ring-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <div className="relative py-8 md:py-12 overflow-hidden">
        <div className="absolute inset-0 opacity-30 w-full bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:6rem_5rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="container px-4 md:px-6 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent">
            {t('themes.title')}
          </h1>
          <p className="text-sm sm:text-base text-[#A89070] mt-1">{t('themes.subtitle')}</p>
        </div>
      </div>

      <div className="pb-10 md:pb-14">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {themes.map((theme, i) => (
              <ThemeCard key={theme.id} theme={theme} index={i} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Themes;
