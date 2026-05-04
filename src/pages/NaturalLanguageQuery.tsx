import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sparkles, Brain, Cpu, TrendingUp, Send, Download, Plus, Image as ImageIcon,
  Paperclip, X, Trash2, MessageSquare, Loader2, ChevronLeft, ChevronRight, Bot, User as UserIcon,
  LogIn, AlertTriangle,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// Color palette for multi-series charts. Cycles through these in order so a
// 3-series bar/line/radar always uses the brand gold first, then warm
// complementary tones. Keep this short and high-contrast — too many series
// is illegible regardless of palette.
const SERIES_COLORS = ['#D4A017', '#22C55E', '#3B82F6', '#A855F7', '#F97316', '#EC4899'] as const;

/* ─── Types ──────────────────────────────────────────────────── */
interface AiVisualization {
  type: 'bar_chart' | 'line_chart' | 'radar_chart' | 'pie_chart' | 'scatter_plot' | 'table' | 'stat_cards';
  title: string;
  data: any[];
  xAxis?: string;
  yAxis?: string;
  headers?: string[];
  rows?: string[][];
}
interface AiDataCitation { indicator: string; country?: string; value: number; year: number; source?: string; }

interface Attachment {
  id: string;
  name: string;
  type: string;
  dataUrl: string; // base64
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
  /** First visualization (back-compat — older stored conversations have only this). */
  visualization?: AiVisualization | null;
  /** All visualizations the AI attached to this answer. New API path. */
  visualizations?: AiVisualization[];
  citations?: AiDataCitation[];
  source?: 'ai' | 'rule-based';
  confidence?: number;
  timestamp: number;
}

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const AI_CHAT_URL = `${API_BASE}/ai/chat`;
// How many prior turns to send for conversational context. Keep small so we
// don't bloat the prompt; Claude can re-derive what it needs from the latest
// user message in most cases.
const HISTORY_TURNS = 8;

const STORAGE_KEY_BASE = 'ayo_ai_conversations_v1';
const LEGACY_STORAGE_KEY = 'ayo_ai_conversations_v1';
const storageKeyFor = (userId: string | null | undefined) =>
  userId ? `${STORAGE_KEY_BASE}_${userId}` : `${STORAGE_KEY_BASE}_guest`;

const suggestedQuestions = [
  'Which 5 African countries have the highest Youth Index scores and why?',
  'Compare Nigeria and Kenya across education, employment, and health indicators',
  'What are the biggest data gaps in Southern Africa?',
  'Show me youth unemployment trends in West Africa from 2018 to 2024',
];

/* ─── Helpers ────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/**
 * Loads conversations for the given user (or the guest bucket when null).
 *
 * For a freshly signed-in user we **fold in any guest chats** that exist on
 * this device — that's the natural carry-over the user expects when they
 * see the "Sign in to keep your history" prompt and follow through. The
 * merge dedupes by conversation id and clears the `_guest` bucket after a
 * successful claim so future guest sessions on the same device start fresh
 * and the data is privately tied to the now-signed-in account.
 *
 * Also continues to handle the legacy unscoped-key migration for users
 * who started chatting before per-user keying landed.
 */
function loadConversationsFor(userId: string | null | undefined): Conversation[] {
  const guestKey = `${STORAGE_KEY_BASE}_guest`;

  const safeRead = (key: string): Conversation[] | null => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Conversation[]) : null;
    } catch {
      return null;
    }
  };

  const own = safeRead(storageKeyFor(userId)) ?? [];

  // Guest path — there's no account to migrate into; just return whatever's
  // under the guest bucket.
  if (!userId) return own;

  // Signed-in path — see if there are guest chats on this device that
  // should follow the user into their account. We merge instead of
  // overwriting so a user who already has account data on this device
  // keeps it AND inherits any new guest activity.
  const guestData = safeRead(guestKey);
  if (guestData && guestData.length > 0) {
    const ownIds = new Set(own.map((c) => c.id));
    const merged = [
      ...guestData.filter((c) => !ownIds.has(c.id)),
      ...own,
    ].sort((a, b) => b.updatedAt - a.updatedAt);
    try {
      localStorage.setItem(storageKeyFor(userId), JSON.stringify(merged));
      localStorage.removeItem(guestKey);
    } catch { /* quota or private mode — fall back to in-memory only */ }
    return merged;
  }

  // No guest carry-over — but check the very-old unscoped key one time, for
  // accounts that started before per-user keying.
  if (own.length === 0) {
    const legacyData = safeRead(LEGACY_STORAGE_KEY);
    if (legacyData && legacyData.length > 0) {
      try {
        localStorage.setItem(storageKeyFor(userId), JSON.stringify(legacyData));
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch { /* quota — return in-memory only */ }
      return legacyData;
    }
  }

  return own;
}

function saveConversationsFor(userId: string | null | undefined, convs: Conversation[]) {
  try { localStorage.setItem(storageKeyFor(userId), JSON.stringify(convs)); } catch {}
}

function titleFromMessage(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= 48) return trimmed;
  return trimmed.slice(0, 45).trim() + '…';
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ts).toLocaleDateString();
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br/>');
}

function downloadVisualizationSvg(containerId: string, filename: string) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const svg = container.querySelector('svg');
  if (!svg) return;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', '100%');
  bg.setAttribute('height', '100%');
  bg.setAttribute('fill', '#0a0a0a');
  clone.insertBefore(bg, clone.firstChild);
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function GlassTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="backdrop-blur-md bg-black/70 border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-gray-300 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color || '#D4A017' }}>
          {entry.name ?? 'Value'}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

/**
 * Inspects the chart's data array and returns the numeric series keys
 * (everything that isn't the x-axis label). Handles the common shapes:
 *   - {name, value}                       → ['value']
 *   - {name, male, female}                → ['male', 'female']
 *   - {year, Kenya, Nigeria}              → ['Kenya', 'Nigeria']
 *   - {x, y, name}                        → ['y']  (scatter — x is axis)
 * Falls back to ['value'] if the data is empty or shapeless so the chart
 * still renders something.
 */
function detectSeries(data: any[], xKey: string): string[] {
  if (!Array.isArray(data) || data.length === 0) return ['value'];
  const first = data[0] || {};
  const numericKeys = Object.keys(first).filter((k) => {
    if (k === xKey || k === 'name') return false;
    const v = first[k];
    return typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v)));
  });
  return numericKeys.length > 0 ? numericKeys : ['value'];
}

function VisualizationRenderer({ viz, id }: { viz: AiVisualization; id: string }) {
  switch (viz.type) {
    case 'bar_chart': {
      const series = detectSeries(viz.data, 'name');
      return (
        <div id={id}>
          <ResponsiveContainer width="100%" height={Math.max(250, Math.min(360, viz.data.length * 28 + 90))}>
            <BarChart data={viz.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} interval={0} angle={viz.data.length > 6 ? -25 : 0} textAnchor={viz.data.length > 6 ? 'end' : 'middle'} height={viz.data.length > 6 ? 60 : 30} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} label={viz.yAxis ? { value: viz.yAxis, angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 11 } } : undefined} />
              <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />}
              {series.map((key, i) => (
                <Bar key={key} dataKey={key} fill={SERIES_COLORS[i % SERIES_COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }
    case 'line_chart': {
      const xKey = viz.data[0]?.year !== undefined ? 'year' : viz.data[0]?.x !== undefined ? 'x' : 'name';
      const series = detectSeries(viz.data, xKey);
      return (
        <div id={id}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={viz.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#888' }} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} label={viz.yAxis ? { value: viz.yAxis, angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 11 } } : undefined} />
              <Tooltip content={<GlassTooltip />} />
              {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />}
              {series.map((key, i) => (
                <Line key={key} type="monotone" dataKey={key} stroke={SERIES_COLORS[i % SERIES_COLORS.length]} strokeWidth={2} dot={{ fill: SERIES_COLORS[i % SERIES_COLORS.length], r: 3 }} activeDot={{ r: 5 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }
    case 'radar_chart': {
      const series = detectSeries(viz.data, 'name');
      return (
        <div id={id}>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={viz.data}>
              <PolarGrid stroke="#333" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} />
              <PolarRadiusAxis tick={{ fontSize: 10, fill: '#888' }} />
              <Tooltip content={<GlassTooltip />} />
              {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />}
              {series.map((key, i) => (
                <Radar
                  key={key}
                  name={key}
                  dataKey={key}
                  stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                  fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      );
    }
    case 'pie_chart':
      return (
        <div id={id}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={viz.data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={95}
                label={(entry: any) => `${entry.name}: ${typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}`}
                labelLine={{ stroke: '#444' }}
              >
                {viz.data.map((_, i) => (
                  <Cell key={i} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<GlassTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    case 'scatter_plot':
      return (
        <div id={id}>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" dataKey="x" name={viz.xAxis || 'x'} tick={{ fontSize: 11, fill: '#888' }} label={viz.xAxis ? { value: viz.xAxis, position: 'insideBottom', offset: -5, style: { fill: '#888', fontSize: 11 } } : undefined} />
              <YAxis type="number" dataKey="y" name={viz.yAxis || 'y'} tick={{ fontSize: 11, fill: '#888' }} label={viz.yAxis ? { value: viz.yAxis, angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 11 } } : undefined} />
              <ZAxis range={[60, 60]} />
              <Tooltip content={<GlassTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={viz.data} fill="#D4A017" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      );
    case 'table':
      return (
        <div id={id} className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                {viz.headers?.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {viz.rows?.map((row, i) => (
                <tr key={i} className="border-b border-gray-800 hover:bg-white/[0.02]">
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-2 text-gray-300">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'stat_cards':
      return (
        <div id={id} className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {viz.data.map((card: any, i: number) => (
            <div key={i} className="bg-white/[0.03] border border-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className="text-lg font-bold text-white">{card.value}{card.unit ? ` ${card.unit}` : ''}</p>
              {card.change !== undefined && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${card.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  <TrendingUp className={`h-3 w-3 ${card.change < 0 ? 'rotate-180' : ''}`} />
                  {card.change >= 0 ? '+' : ''}{card.change}
                </p>
              )}
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

function parseVisualizationFromText(text: string): AiVisualization | null {
  const all = parseAllVisualizationsFromText(text);
  return all.length > 0 ? all[0] : null;
}

/**
 * Walks every fenced ```json block in `text` and returns each one that
 * normalizes to a valid AiVisualization. Tolerates both the `data` shape
 * (bar/line/pie/etc.) and the `rows`-only shape used by tables.
 */
function parseAllVisualizationsFromText(text: string): AiVisualization[] {
  const jsonBlockRegex = /```json\s*([\s\S]*?)```/g;
  const out: AiVisualization[] = [];
  let match: RegExpExecArray | null;
  while ((match = jsonBlockRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      const normalized = normalizeVisualization(parsed);
      if (normalized) out.push(normalized);
    } catch { /* skip */ }
  }
  return out;
}

function stripVisualizationBlocks(text: string): string {
  return text.replace(/```json\s*\{[\s\S]*?"type"\s*:\s*"(bar_chart|line_chart|radar_chart|pie_chart|scatter_plot|table|stat_cards|bar|line|pie|area|radar)"[\s\S]*?```/g, '').trim();
}

/**
 * The backend's system prompt asks the model to emit `{"type":"bar"|"line"|...}`
 * (singular), but our renderer expects `bar_chart|line_chart|...`. Normalize
 * here so either shape works without changing the prompt or the renderer.
 */
function normalizeVisualization(raw: any): AiVisualization | null {
  if (!raw || typeof raw !== 'object') return null;
  const typeMap: Record<string, AiVisualization['type']> = {
    bar: 'bar_chart',
    bar_chart: 'bar_chart',
    line: 'line_chart',
    line_chart: 'line_chart',
    area: 'line_chart',
    pie: 'pie_chart',
    pie_chart: 'pie_chart',
    scatter: 'scatter_plot',
    scatter_plot: 'scatter_plot',
    radar: 'radar_chart',
    radar_chart: 'radar_chart',
    table: 'table',
    stat_cards: 'stat_cards',
    stats: 'stat_cards',
  };
  const t = typeMap[raw.type];
  if (!t) return null;

  // Tables can come either as `{headers, rows}` or as `{columns, rows}`. The
  // backend prompt uses `columns`. Map both onto the renderer's `headers`.
  const headers = raw.headers ?? raw.columns;
  const data = Array.isArray(raw.data) ? raw.data : [];
  return {
    type: t,
    title: raw.title || 'Visualization',
    data,
    xAxis: raw.xAxis,
    yAxis: raw.yAxis,
    headers,
    rows: raw.rows,
  };
}

/**
 * Catches navigation intent so we can show a confirm modal before a guest
 * leaves the Ask AI page and risks losing chat history. Two interception
 * paths cover the realistic exit routes:
 *
 *   1. `beforeunload` — tab close / refresh. The browser shows its own
 *      generic "Reload site?" dialog; we can't customize the text but the
 *      prompt itself is enough to stop accidental closes.
 *   2. Document-level `click` capture on `<a>` elements — sidebar links,
 *      logo, in-page nav. We swallow the click and surface our own custom
 *      modal via `onLeaveAttempt(href)` so the page can decide what to do.
 *
 * Skipped automatically:
 *   - Modifier-key clicks (open in new tab — user wants to keep this tab)
 *   - `target="_blank"` and download links
 *   - External / mailto / hash links
 *   - Same-page navigations
 *   - `/auth/...` links — heading to sign in is the desired escape hatch
 */
function useGuestExitGuard(active: boolean, onLeaveAttempt: (href: string) => void) {
  // Stable ref so the effect can stay tight (active toggle) without rebinding
  // listeners every render.
  const handlerRef = useRef(onLeaveAttempt);
  useEffect(() => { handlerRef.current = onLeaveAttempt; }, [onLeaveAttempt]);

  useEffect(() => {
    if (!active) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // legacy chrome / firefox API
    };

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      // Open-in-new-tab style clicks — let them happen, current tab stays.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href) return;
      if (/^(https?:|mailto:|tel:|#)/i.test(href)) return;

      // Same-page navigations don't lose state.
      if (href === window.location.pathname || href === window.location.pathname + window.location.search) return;

      // Auth flow is the user's escape hatch — never block it.
      if (href.startsWith('/auth/')) return;

      e.preventDefault();
      e.stopPropagation();
      handlerRef.current(href);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick, true);
    };
  }, [active]);
}

/* ─── Sidebar ────────────────────────────────────────────────── */
function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  collapsed,
  onToggleCollapsed,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  if (collapsed) {
    return (
      <div className="hidden md:flex flex-col items-center gap-2 w-12 py-3 border-r border-gray-800 bg-white/[0.02]">
        <button onClick={onToggleCollapsed} className="p-2 rounded-lg hover:bg-white/[0.05] text-gray-400 hover:text-white transition-colors" title="Show history">
          <ChevronRight className="h-4 w-4" />
        </button>
        <button onClick={onNew} className="p-2 rounded-lg bg-[#D4A017]/10 text-[#D4A017] hover:bg-[#D4A017]/20 transition-colors" title="New chat">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-gray-800 bg-white/[0.02]">
      <div className="p-3 border-b border-gray-800/60 flex items-center justify-between gap-2">
        <Button onClick={onNew} size="sm" className="flex-1 gap-2 h-8 text-xs">
          <Plus className="h-3.5 w-3.5" /> New chat
        </Button>
        <button onClick={onToggleCollapsed} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-gray-400 hover:text-white transition-colors" title="Hide history">
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <p className="px-2 pt-1 pb-2 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">History</p>
        {sorted.length === 0 && (
          <p className="px-2 text-xs text-gray-500 italic">No conversations yet</p>
        )}
        {sorted.map((c) => {
          const isActive = c.id === activeId;
          return (
            <div
              key={c.id}
              className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                isActive ? 'bg-[#D4A017]/10 border border-[#D4A017]/30' : 'hover:bg-white/[0.04] border border-transparent'
              }`}
              onClick={() => onSelect(c.id)}
            >
              <MessageSquare className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? 'text-[#D4A017]' : 'text-gray-500'}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-medium truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>{c.title}</p>
                <p className="text-[10px] text-gray-500">{relativeTime(c.updatedAt)} · {c.messages.length} msg</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/15 text-gray-400 hover:text-red-400 transition-all"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

/* ─── Message bubble ─────────────────────────────────────────── */
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const vizId = `viz-${message.id}`;

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-[#D4A017] text-black' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
      }`}>
        {isUser ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`flex-1 min-w-0 max-w-[78%] ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-[#D4A017]/12 border border-[#D4A017]/30 text-white'
            : 'bg-white/[0.04] border border-gray-800 text-gray-100'
        }`}>
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.attachments.map((a) => (
                <div key={a.id} className="rounded-lg overflow-hidden border border-white/10 max-w-[180px]">
                  {a.type.startsWith('image/') ? (
                    <img src={a.dataUrl} alt={a.name} className="block max-h-44 object-cover" />
                  ) : (
                    <div className="px-3 py-2 text-xs text-gray-300 bg-white/[0.03]">{a.name}</div>
                  )}
                </div>
              ))}
            </div>
          )}
          {message.content && (
            <div
              className="prose prose-invert prose-sm max-w-none [&_p]:m-0 [&_p+p]:mt-2 leading-relaxed text-sm"
              dangerouslySetInnerHTML={{ __html: '<p>' + renderMarkdown(message.content) + '</p>' }}
            />
          )}
          {(() => {
            // Prefer the multi-viz array when present; fall back to the
            // legacy single `visualization` field for older stored chats.
            const vizList: AiVisualization[] =
              (message.visualizations && message.visualizations.length > 0
                ? message.visualizations
                : message.visualization
                ? [message.visualization]
                : []);
            if (vizList.length === 0) return null;
            return (
              <div className="mt-3 pt-3 border-t border-white/10 space-y-4">
                {vizList.map((v, i) => {
                  const localId = `${vizId}-${i}`;
                  return (
                    <div key={localId}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-300">{v.title}</p>
                        <button
                          onClick={() => downloadVisualizationSvg(localId, v.title.replace(/\s+/g, '-').toLowerCase() || `chart-${i + 1}`)}
                          className="inline-flex items-center gap-1 text-[10px] text-gray-500 hover:text-[#D4A017] transition-colors"
                        >
                          <Download className="h-3 w-3" /> SVG
                        </button>
                      </div>
                      <VisualizationRenderer viz={v} id={localId} />
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
        {/* The "AI · 100% confidence" footer used to render here. Removed —
            the badge added noise under every reply, and the 100% number on
            an AI response is meaningless (Claude doesn't return a calibrated
            confidence). The "Rule-based" badge can come back behind a debug
            flag if needed; for now the message body speaks for itself. */}
      </div>
    </div>
  );
}

/* ─── Composer (input at the bottom) ─────────────────────────── */
function Composer({
  value,
  onChange,
  onSubmit,
  isLoading,
  attachments,
  onAddAttachments,
  onRemoveAttachment,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  attachments: Attachment[];
  onAddAttachments: (files: FileList | File[]) => void;
  onRemoveAttachment: (id: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files || []);
    if (files.length > 0) {
      e.preventDefault();
      onAddAttachments(files);
    }
  };

  return (
    <div className="px-4 pb-4 pt-2 border-t border-gray-800/40 bg-gradient-to-t from-black/30 to-transparent">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 max-w-3xl mx-auto">
          {attachments.map((a) => (
            <div key={a.id} className="relative group">
              {a.type.startsWith('image/') ? (
                <img src={a.dataUrl} alt={a.name} className="h-16 w-16 object-cover rounded-lg border border-gray-700" />
              ) : (
                <div className="h-16 w-16 rounded-lg border border-gray-700 bg-white/[0.03] flex items-center justify-center text-[10px] text-gray-400 px-1 text-center">
                  {a.name.slice(0, 14)}
                </div>
              )}
              <button
                onClick={() => onRemoveAttachment(a.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="relative flex items-end gap-2 max-w-3xl mx-auto bg-white/[0.04] border border-gray-800 rounded-2xl px-3 py-2.5 focus-within:border-[#D4A017]/40 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.csv,.xlsx,.xls,.txt"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) onAddAttachments(e.target.files);
            e.target.value = '';
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex-shrink-0 p-2 rounded-lg hover:bg-white/[0.05] text-gray-400 hover:text-[#D4A017] transition-colors disabled:opacity-30"
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Ask anything about African youth data… (Shift+Enter for new line)"
          rows={1}
          disabled={isLoading}
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 resize-none outline-none max-h-44 leading-relaxed disabled:opacity-50 py-1"
        />
        <button
          onClick={onSubmit}
          disabled={(!value.trim() && attachments.length === 0) || isLoading}
          className="flex-shrink-0 p-2 rounded-xl bg-[#D4A017] text-black hover:bg-[#E0B030] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Send"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
      <p className="text-[10px] text-gray-600 text-center mt-2 max-w-3xl mx-auto">
        AI can make mistakes. Verify critical data points against the source.
      </p>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */
const NaturalLanguageQuery = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userKey = user?.id ?? null; // null while auth loads / signed out

  // Pending navigation — when set, the guest-exit modal opens. The string is
  // the href the user tried to navigate to (or `'tab-close'` for a window
  // unload attempt — currently unused since browsers gate that with their
  // own native dialog). Cleared when the user picks a button.
  const [pendingNav, setPendingNav] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const dragCounter = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );
  const messages = activeConversation?.messages ?? [];

  // The guest-exit guard fires when:
  //   - there's no signed-in user, AND
  //   - they've already exchanged at least one message (otherwise there's
  //     nothing worth nagging them to save).
  // Signed-in users skip the guard entirely — their conversations are
  // already keyed to their account in localStorage and (when we wire it)
  // synced server-side.
  const totalMessages = useMemo(
    () => conversations.reduce((n, c) => n + c.messages.length, 0),
    [conversations],
  );
  const guardActive = !user && totalMessages > 0;
  useGuestExitGuard(guardActive, useCallback((href: string) => setPendingNav(href), []));

  // Hydrate per user — re-runs whenever the signed-in user changes so each
  // account sees only its own chat history on this device.
  useEffect(() => {
    setHydrated(false);
    const stored = loadConversationsFor(userKey);
    setConversations(stored);
    setActiveId(stored.length > 0 ? stored.sort((a, b) => b.updatedAt - a.updatedAt)[0].id : null);
    setInput('');
    setAttachments([]);
    setHydrated(true);
  }, [userKey]);

  // Persist (per-user key). Skip until hydrated to avoid stomping on the
  // stored layout with the empty initial state.
  useEffect(() => {
    if (!hydrated) return;
    const key = storageKeyFor(userKey);
    if (conversations.length > 0) {
      saveConversationsFor(userKey, conversations);
    } else if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
    }
  }, [conversations, userKey, hydrated]);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isLoading]);

  /* ── Conversation actions ── */
  const newConversation = useCallback(() => {
    const c: Conversation = {
      id: uid(),
      title: 'New chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => [c, ...prev]);
    setActiveId(c.id);
    setInput('');
    setAttachments([]);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (id === activeId) {
        setActiveId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  }, [activeId]);

  /* ── Attachment handlers ── */
  const addAttachments = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    arr.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        setAttachments((prev) => [...prev, { id: uid(), name: file.name, type: file.type || 'application/octet-stream', dataUrl }]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  /* ── Drag & drop ── */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      dragCounter.current++;
      setIsDragging(true);
    }
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addAttachments(e.dataTransfer.files);
    }
  };

  /* ── Send message ── */
  const sendMessage = useCallback(async (text: string, files: Attachment[]) => {
    if (!text.trim() && files.length === 0) return;
    let convId = activeId;
    let prevMessages: ChatMessage[] = [];

    // Ensure a conversation exists
    if (!convId) {
      const c: Conversation = {
        id: uid(), title: titleFromMessage(text || 'New chat'),
        messages: [], createdAt: Date.now(), updatedAt: Date.now(),
      };
      setConversations((p) => [c, ...p]);
      setActiveId(c.id);
      convId = c.id;
    } else {
      const existing = conversations.find((c) => c.id === convId);
      prevMessages = existing?.messages ?? [];
    }

    // Append user message
    const userMsg: ChatMessage = {
      id: uid(), role: 'user', content: text, attachments: files.length > 0 ? files : undefined,
      timestamp: Date.now(),
    };
    setConversations((prev) => prev.map((c) => {
      if (c.id !== convId) return c;
      const isFirst = c.messages.length === 0;
      return {
        ...c,
        title: isFirst && text ? titleFromMessage(text) : c.title,
        messages: [...c.messages, userMsg],
        updatedAt: Date.now(),
      };
    }));
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    // ── Live AI call ─────────────────────────────────────────────────────
    // POST to the NestJS `/ai/chat` endpoint. The backend chooses between
    // the Claude API (when ANTHROPIC_API_KEY is configured) and a rule-based
    // NLQ fallback automatically — we surface the chosen `source` so users
    // see an "AI" vs "Rule-based" pill on the response.
    let assistantContent = '';
    let visualization: AiVisualization | null = null;
    let visualizations: AiVisualization[] = [];
    let source: 'ai' | 'rule-based' = 'ai';
    let confidence: number | undefined;

    try {
      // Build conversation context — last N turns of the existing chat,
      // mapped to the role/content shape the API DTO expects. Skip the
      // user message we just appended (the API takes that as `message`).
      const history = prevMessages
        .slice(-HISTORY_TURNS * 2)
        .filter((m) => !m.attachments || m.attachments.length === 0)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch(AI_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text || '(see attached file)',
          history: history.length > 0 ? history : undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      const rawAnswer = typeof payload.answer === 'string' ? payload.answer : '';

      // Visualizations can come three ways, in priority order:
      //   1. `payload.visualizations` — the new multi-chart array
      //   2. `payload.visualization`  — legacy single-chart field
      //   3. fenced ```json blocks embedded in the answer text
      // We assemble all of them into an array so users see every chart the
      // assistant attached, then strip any embedded blocks from the prose.
      const explicitArray = Array.isArray(payload.visualizations)
        ? payload.visualizations.map((v: any) => normalizeVisualization(v)).filter((v: AiVisualization | null): v is AiVisualization => !!v)
        : [];
      let allViz: AiVisualization[] = explicitArray;
      if (allViz.length === 0) {
        const single = normalizeVisualization(payload.visualization);
        if (single) allViz = [single];
      }
      if (allViz.length === 0) {
        const embedded = parseAllVisualizationsFromText(rawAnswer);
        if (embedded.length > 0) allViz = embedded;
      }

      visualizations = allViz;
      visualization = allViz[0] ?? null;
      assistantContent = allViz.length > 0 ? stripVisualizationBlocks(rawAnswer) : rawAnswer;

      source = payload.source === 'rule-based' ? 'rule-based' : 'ai';
      // Backend doesn't return confidence for AI responses — only the
      // rule-based service has scored confidence. Show 100% on AI (we trust
      // the model output as-is) and the backend's number on rule-based.
      confidence = source === 'ai' ? 1 : (typeof payload.confidence === 'number' ? payload.confidence : undefined);
    } catch (err) {
      assistantContent =
        "I couldn't reach the AI service just now — the request failed before getting a response. " +
        "Try again in a moment, or rephrase your question. " +
        "(In the meantime, you can explore the same data in **Data Explorer** or **Compare Countries**.)";
      source = 'rule-based';
      confidence = undefined;
    }

    const assistantMsg: ChatMessage = {
      id: uid(),
      role: 'assistant',
      content: assistantContent,
      visualization,
      visualizations: visualizations.length > 0 ? visualizations : undefined,
      source,
      confidence,
      timestamp: Date.now(),
    };
    setConversations((prev) => prev.map((c) => c.id === convId
      ? { ...c, messages: [...c.messages, assistantMsg], updatedAt: Date.now() }
      : c,
    ));
    setIsLoading(false);
  }, [activeId, conversations]);

  const handleSubmit = () => {
    sendMessage(input.trim(), attachments);
  };

  const handleSuggested = (q: string) => {
    sendMessage(q, []);
  };

  /* ── Render ── */
  return (
    <div
      className="flex h-[calc(100vh-7rem)] -m-4 md:-m-6 relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none bg-[#D4A017]/10 border-2 border-dashed border-[#D4A017]/60 rounded-2xl m-2">
          <div className="text-center">
            <ImageIcon className="h-10 w-10 text-[#D4A017] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#D4A017]">Drop to attach</p>
          </div>
        </div>
      )}

      <ConversationSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={newConversation}
        onDelete={deleteConversation}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/60">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-4 w-4 text-[#D4A017] flex-shrink-0" />
            <h1 className="text-sm font-semibold truncate">{activeConversation?.title || 'Ask AI'}</h1>
          </div>
          <Button onClick={newConversation} variant="ghost" size="sm" className="md:hidden gap-1.5 text-xs h-8">
            <Plus className="h-3.5 w-3.5" /> New
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 && !isLoading && (
            <div className="max-w-2xl mx-auto h-full flex flex-col items-center justify-center text-center py-10">
              <div className="h-12 w-12 rounded-full bg-[#D4A017]/15 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-[#D4A017]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent mb-2">
                What can I help you explore?
              </h2>
              <p className="text-sm text-gray-400 max-w-md mb-6">
                Ask questions about African youth data. Drop images, share data files, get insights with charts.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSuggested(q)}
                    className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-gray-800/60 text-xs text-gray-400 hover:text-gray-200 hover:bg-white/[0.06] hover:border-[#D4A017]/30 transition-all text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="max-w-3xl mx-auto space-y-5">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-white/[0.04] border border-gray-800 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                  <span className="text-xs text-gray-400">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Composer */}
        <Composer
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          attachments={attachments}
          onAddAttachments={addAttachments}
          onRemoveAttachment={removeAttachment}
        />
      </main>

      {/* Guest exit confirmation — only mounts when the guard catches a
          navigation attempt. Three exits:
            • Stay on page    — close modal, don't navigate
            • Sign in         — go to /auth/signin (the desired escape hatch)
            • Leave anyway    — navigate to wherever they originally clicked */}
      <Dialog
        open={pendingNav !== null}
        onOpenChange={(open) => { if (!open) setPendingNav(null); }}
      >
        <DialogContent className="bg-black/95 border-gray-800 max-w-md">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-9 w-9 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base">Save your chat history?</DialogTitle>
                <DialogDescription className="text-xs leading-relaxed mt-1.5">
                  You're chatting as a guest, so this conversation lives only on this device. Clearing
                  your browser data, switching devices, or signing out will erase it. Sign in to keep
                  your history across devices and never lose it.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPendingNav(null)}
              className="text-xs"
            >
              Stay on page
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPendingNav(null);
                navigate('/auth/signin');
              }}
              className="text-xs gap-1.5 border-[#D4A017]/40 text-[#D4A017] hover:bg-[#D4A017]/10 hover:text-[#D4A017]"
            >
              <LogIn className="h-3.5 w-3.5" /> Sign in
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                const target = pendingNav;
                setPendingNav(null);
                if (target && target !== 'tab-close') navigate(target);
              }}
              className="text-xs"
            >
              Leave anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NaturalLanguageQuery;
