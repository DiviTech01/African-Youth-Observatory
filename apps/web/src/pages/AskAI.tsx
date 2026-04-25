// ============================================
// AFRICAN YOUTH OBSERVATORY — ASK AI CHAT PAGE
// Full Claude-powered chat with history, file
// upload, visualizations, and document export.
// ============================================

import React, {
  useState, useRef, useEffect, useCallback,
  DragEvent, ChangeEvent, KeyboardEvent,
} from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Send, Paperclip, X, Plus, ChevronLeft, ChevronRight,
  Download, BarChart2, TrendingUp, Heart, Trophy,
  GraduationCap, FileText, Bot, User, Loader2,
  Trash2, MessageSquare, Sparkles, Globe,
} from 'lucide-react';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface FileAttachment {
  name: string;
  type: string;
  content: string;
  size: number;
}

interface VizData {
  type: 'bar' | 'line' | 'pie' | 'area' | 'table';
  title?: string;
  data?: Record<string, unknown>[];
  columns?: string[];
  rows?: (string | number)[][];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  visualization?: VizData;
  followUpQuestions?: string[];
  attachments?: FileAttachment[];
  timestamp: number;
  isGenerating?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const CHART_COLORS = [
  '#10b981', '#f59e0b', '#3b82f6', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
];

const SUGGESTIONS = [
  {
    icon: TrendingUp,
    title: 'Youth Unemployment',
    prompt: 'What are youth unemployment trends across African regions? Which countries have improved the most?',
  },
  {
    icon: GraduationCap,
    title: 'Education Access',
    prompt: 'Compare youth education enrollment rates across the 5 African regions and identify the key gaps.',
  },
  {
    icon: Heart,
    title: 'Health Metrics',
    prompt: 'Show key youth health indicators across Africa — HIV prevalence, child mortality, and healthcare access.',
  },
  {
    icon: Trophy,
    title: 'Top Performers',
    prompt: 'Which 10 countries rank highest on the African Youth Index and what drives their success?',
  },
  {
    icon: Globe,
    title: 'Regional Analysis',
    prompt: 'Give me a regional breakdown of youth development indicators across all 5 African sub-regions.',
  },
  {
    icon: FileText,
    title: 'Generate Report',
    prompt: 'Generate a comprehensive structured report on African youth development with data tables, key findings, and recommendations.',
  },
] as const;

const _envApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const BASE_URL =
  _envApiUrl && _envApiUrl.startsWith('http')
    ? _envApiUrl
    : import.meta.env.PROD
    ? 'https://african-youth-observatory.onrender.com/api'
    : '/api';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem('ayd_chat_sessions');
    return raw ? (JSON.parse(raw) as ChatSession[]) : [];
  } catch {
    return [];
  }
}

function persistSessions(sessions: ChatSession[]) {
  localStorage.setItem('ayd_chat_sessions', JSON.stringify(sessions.slice(0, 50)));
}

function dateLabel(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function groupByDate(sessions: ChatSession[]): Record<string, ChatSession[]> {
  return sessions.reduce<Record<string, ChatSession[]>>((acc, s) => {
    const lbl = dateLabel(s.updatedAt);
    (acc[lbl] ??= []).push(s);
    return acc;
  }, {});
}

function normalizeVizData(data: Record<string, unknown>[]): { name: string; value: number }[] {
  return data.map((item) => ({
    name: String(item.name ?? item.country ?? item.region ?? item.label ?? item.category ?? ''),
    value: Number(item.value ?? item.score ?? item.count ?? item.rate ?? item.amount ?? 0),
  }));
}

// ─────────────────────────────────────────────
// DOCUMENT EXPORT
// ─────────────────────────────────────────────

function mdToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>(\n|$))+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n+/g, '</p><p>')
    .replace(/^(?!<[hup\/]|<li|<ul)(.+)$/gm, '<p>$1</p>');
}

function downloadDocument(content: string, title = 'AYD Report') {
  const html = `<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"><title>${title}</title><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;background:#fff}
.cover{background:linear-gradient(135deg,#065f46 0%,#1d4ed8 100%);color:#fff;padding:56px 48px}
.brand{display:flex;align-items:center;gap:10px;margin-bottom:24px}
.brand-badge{background:rgba(255,255,255,.2);padding:6px 14px;border-radius:8px;font-weight:800;font-size:17px}
.cover h1{font-size:30px;font-weight:800;margin-bottom:6px}
.cover p{font-size:14px;opacity:.8}
.content{max-width:760px;margin:40px auto;padding:0 40px 60px}
h1{font-size:22px;font-weight:700;color:#065f46;margin:28px 0 10px;border-bottom:2px solid #d1fae5;padding-bottom:6px}
h2{font-size:18px;font-weight:600;color:#1d4ed8;margin:22px 0 8px}
h3{font-size:15px;font-weight:600;color:#374151;margin:16px 0 6px}
p{font-size:14px;line-height:1.75;color:#374151;margin-bottom:10px}
ul,ol{padding-left:22px;margin-bottom:10px}
li{font-size:14px;line-height:1.6;color:#374151;margin-bottom:3px}
strong{font-weight:700;color:#111827}em{font-style:italic}
code{background:#f3f4f6;padding:1px 5px;border-radius:3px;font-family:monospace;font-size:12px}
table{width:100%;border-collapse:collapse;margin:14px 0}
th{background:#065f46;color:#fff;padding:9px 13px;text-align:left;font-size:13px}
td{padding:8px 13px;border-bottom:1px solid #e5e7eb;font-size:13px}
tr:nth-child(even) td{background:#f9fafb}
.footer{text-align:center;color:#9ca3af;font-size:11px;padding:20px;border-top:1px solid #e5e7eb;margin-top:40px}
@media print{.cover,.cover *{-webkit-print-color-adjust:exact;print-color-adjust:exact}th{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head>
<body>
<div class="cover">
  <div class="brand"><span class="brand-badge">AYD</span><span style="font-size:13px;opacity:.75">African Youth Observatory</span></div>
  <h1>${title}</h1>
  <p>African Youth Observatory &mdash; Data Intelligence Platform</p>
  <p style="margin-top:6px;opacity:.65">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
</div>
<div class="content">${mdToHtml(content)}</div>
<div class="footer">African Youth Observatory &bull; african-youth-observatory.onrender.com</div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ayd-report-${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────
// INLINE MARKDOWN RENDERER
// ─────────────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`'))
      return (
        <code key={i} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      );
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function MarkdownContent({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  const lines = text.split('\n');
  let listItems: React.ReactNode[] = [];
  let inCode = false;
  let codeLines: string[] = [];
  let keyCounter = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    nodes.push(
      <ul key={`ul-${keyCounter++}`} className="list-disc pl-5 space-y-0.5 my-1.5 text-sm text-foreground/90">
        {listItems}
      </ul>,
    );
    listItems = [];
  };

  lines.forEach((line, i) => {
    if (line.startsWith('```')) {
      if (inCode) {
        nodes.push(
          <pre key={`pre-${keyCounter++}`} className="bg-muted rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono whitespace-pre">
            {codeLines.join('\n')}
          </pre>,
        );
        codeLines = [];
        inCode = false;
      } else {
        flushList();
        inCode = true;
      }
      return;
    }
    if (inCode) { codeLines.push(line); return; }

    if (line.startsWith('### ')) {
      flushList();
      nodes.push(<h3 key={i} className="font-semibold text-sm mt-3 mb-1">{renderInline(line.slice(4))}</h3>);
    } else if (line.startsWith('## ')) {
      flushList();
      nodes.push(<h2 key={i} className="font-bold text-base mt-4 mb-1.5 text-foreground">{renderInline(line.slice(3))}</h2>);
    } else if (line.startsWith('# ')) {
      flushList();
      nodes.push(<h1 key={i} className="font-bold text-lg mt-4 mb-2 text-foreground">{renderInline(line.slice(2))}</h1>);
    } else if (/^[-*] /.test(line)) {
      listItems.push(<li key={i}>{renderInline(line.slice(2))}</li>);
    } else if (/^\d+\. /.test(line)) {
      listItems.push(<li key={i}>{renderInline(line.replace(/^\d+\. /, ''))}</li>);
    } else if (line.trim() === '') {
      flushList();
    } else {
      flushList();
      nodes.push(
        <p key={i} className="text-sm leading-relaxed text-foreground/90">
          {renderInline(line)}
        </p>,
      );
    }
  });
  flushList();

  return <div className="space-y-1">{nodes}</div>;
}

// ─────────────────────────────────────────────
// VISUALIZATION RENDERER
// ─────────────────────────────────────────────

function VizRenderer({ viz }: { viz: VizData }) {
  if (viz.type === 'table' && viz.columns && viz.rows) {
    return (
      <div className="mt-3 overflow-x-auto rounded-xl border border-border">
        {viz.title && (
          <p className="text-xs font-semibold text-muted-foreground px-3 pt-2.5 pb-1">{viz.title}</p>
        )}
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              {viz.columns.map((col, i) => (
                <th key={i} className="text-left px-3 py-2 font-medium text-muted-foreground">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {viz.rows?.map((row, i) => (
              <tr key={i} className={i % 2 === 1 ? 'bg-muted/20' : ''}>
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2 border-t border-border/50">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!viz.data?.length) return null;
  const chartData = normalizeVizData(viz.data);

  return (
    <div className="mt-3 p-3 bg-muted/20 rounded-xl border border-border">
      {viz.title && (
        <p className="text-xs font-semibold mb-2.5 text-muted-foreground">{viz.title}</p>
      )}
      <ResponsiveContainer width="100%" height={220}>
        {viz.type === 'pie' ? (
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((_, idx) => (
                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
              ))}
            </Pie>
            <RechartsTip />
            <Legend />
          </PieChart>
        ) : viz.type === 'line' ? (
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <RechartsTip />
            <Line type="monotone" dataKey="value" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        ) : viz.type === 'area' ? (
          <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <RechartsTip />
            <Area
              type="monotone"
              dataKey="value"
              stroke={CHART_COLORS[0]}
              fill={`${CHART_COLORS[0]}33`}
              strokeWidth={2}
            />
          </AreaChart>
        ) : (
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <RechartsTip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((_, idx) => (
                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// ─────────────────────────────────────────────
// MESSAGE BUBBLE
// ─────────────────────────────────────────────

function MessageBubble({
  message,
  onFollowUp,
}: {
  message: Message;
  onFollowUp: (q: string) => void;
}) {
  const isUser = message.role === 'user';
  const isLong = !isUser && message.content.length > 400;

  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-emerald-600 text-white'
        }`}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      <div className={`flex flex-col gap-1.5 max-w-[84%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* File attachments */}
        {message.attachments?.map((file, i) => (
          <div
            key={i}
            className="flex items-center gap-2 bg-muted/60 px-3 py-1.5 rounded-lg text-xs text-muted-foreground border border-border"
          >
            <Paperclip size={11} />
            <span>{file.name}</span>
            <span className="opacity-60">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        ))}

        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-card border border-border rounded-tl-sm'
          }`}
        >
          {message.isGenerating ? (
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Loader2 size={13} className="animate-spin" />
              <span className="text-sm">Thinking</span>
              <div className="flex gap-1">
                {[0, 1, 2].map((n) => (
                  <span
                    key={n}
                    className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
                    style={{ animationDelay: `${n * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          ) : isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownContent text={message.content} />
          )}
        </div>

        {/* Visualization */}
        {!isUser && message.visualization && !message.isGenerating && (
          <div className="w-full max-w-xl">
            <VizRenderer viz={message.visualization} />
          </div>
        )}

        {/* Actions row */}
        {!isUser && !message.isGenerating && (
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            {isLong && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 rounded-full"
                onClick={() => {
                  const title = message.content.split('\n')[0].replace(/^#+ /, '') || 'AYD Report';
                  downloadDocument(message.content, title);
                }}
              >
                <Download size={11} />
                Download as Document
              </Button>
            )}
            {message.followUpQuestions?.map((q, i) => (
              <button
                key={i}
                onClick={() => onFollowUp(q)}
                className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground px-1">
          {new Date(message.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────

function ChatSidebar({
  open,
  onClose,
  sessions,
  currentId,
  onSelect,
  onNew,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  const grouped = groupByDate(sessions);

  return (
    <aside
      className={`flex flex-col shrink-0 h-full border-r border-border bg-card/40 backdrop-blur transition-all duration-300 ease-in-out overflow-hidden ${
        open ? 'w-60' : 'w-0'
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border shrink-0">
        <span className="font-semibold text-sm">Chat History</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <ChevronLeft size={15} />
        </Button>
      </div>

      <div className="px-2 py-2 shrink-0">
        <Button
          onClick={onNew}
          variant="outline"
          className="w-full justify-start gap-2 h-8 text-xs"
        >
          <Plus size={13} />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 pb-4 space-y-3">
          {Object.entries(grouped).map(([label, items]) => (
            <div key={label}>
              <p className="text-[10px] font-bold uppercase text-muted-foreground px-2 mb-1 tracking-widest">
                {label}
              </p>
              {items.map((session) => (
                <div
                  key={session.id}
                  className={`group flex items-center justify-between rounded-lg px-2 py-2 cursor-pointer hover:bg-accent transition-colors ${
                    currentId === session.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => onSelect(session.id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare size={12} className="shrink-0 text-muted-foreground" />
                    <span className="text-xs truncate">{session.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-destructive transition-all ml-1 shrink-0"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">No chats yet</p>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

// ─────────────────────────────────────────────
// WELCOME SCREEN
// ─────────────────────────────────────────────

function WelcomeScreen({ onSuggestion }: { onSuggestion: (p: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full py-16 px-4">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
        <Sparkles className="w-7 h-7 text-primary" />
      </div>
      <h1 className="text-2xl font-bold mb-2 text-center">Ask anything about African Youth</h1>
      <p className="text-sm text-muted-foreground mb-10 text-center max-w-md leading-relaxed">
        Explore data from 54 countries, generate reports, compare regions, and uncover
        insights powered by Claude AI.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-2xl">
        {SUGGESTIONS.map(({ icon: Icon, title, prompt }) => (
          <button
            key={title}
            onClick={() => onSuggestion(prompt)}
            className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors mt-0.5">
              <Icon size={15} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                {prompt}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CHAT INPUT BAR
// ─────────────────────────────────────────────

function ChatInputBar({
  onSend,
  onFileSelect,
  attachments,
  onRemoveFile,
  disabled,
}: {
  onSend: (text: string) => void;
  onFileSelect: (files: FileList) => void;
  attachments: FileAttachment[];
  onRemoveFile: (idx: number) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const doSend = () => {
    const t = text.trim();
    if (!t && attachments.length === 0) return;
    onSend(t);
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  return (
    <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur px-4 py-3">
      <div className="max-w-3xl mx-auto">
        {/* Attachment chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 bg-muted/60 border border-border px-2.5 py-1 rounded-full text-xs text-muted-foreground"
              >
                <Paperclip size={10} />
                <span className="max-w-[130px] truncate">{file.name}</span>
                <button onClick={() => onRemoveFile(i)} className="hover:text-destructive">
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input box */}
        <div className="flex items-end gap-2 bg-card border border-border rounded-2xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/25 focus-within:border-primary/40 transition-all">
          <button
            onClick={() => fileRef.current?.click()}
            className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Attach document for context"
          >
            <Paperclip size={18} />
          </button>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKey}
            placeholder="Ask about African youth data, request a report, or upload a document..."
            disabled={disabled}
            className="flex-1 resize-none bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground min-h-[36px] max-h-[160px] leading-relaxed py-1 disabled:opacity-50"
            rows={1}
          />

          <button
            onClick={doSend}
            disabled={disabled || (!text.trim() && attachments.length === 0)}
            className="shrink-0 p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {disabled ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".txt,.csv,.json,.md,.pdf"
          className="hidden"
          onChange={(e) => e.target.files && onFileSelect(e.target.files)}
        />

        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Enter to send · Shift+Enter for new line · Drag &amp; drop files to attach
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

export default function AskAI() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const upsertSession = useCallback(
    (id: string, msgs: Message[], title?: string) => {
      setSessions((prev) => {
        const existing = prev.find((s) => s.id === id);
        const updated: ChatSession = {
          id,
          title: title || existing?.title || 'New Chat',
          createdAt: existing?.createdAt ?? Date.now(),
          updatedAt: Date.now(),
          messages: msgs,
        };
        const next = [updated, ...prev.filter((s) => s.id !== id)];
        persistSessions(next);
        return next;
      });
    },
    [],
  );

  const startNewChat = useCallback(() => {
    const id = genId();
    const session: ChatSession = {
      id,
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    setSessions((prev) => {
      const next = [session, ...prev];
      persistSessions(next);
      return next;
    });
    setCurrentId(id);
    setMessages([]);
    setAttachments([]);
  }, []);

  const selectSession = useCallback(
    (id: string) => {
      const session = sessions.find((s) => s.id === id);
      if (session) {
        setCurrentId(id);
        setMessages(session.messages);
        setAttachments([]);
      }
    },
    [sessions],
  );

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        persistSessions(next);
        return next;
      });
      if (currentId === id) {
        setCurrentId(null);
        setMessages([]);
      }
    },
    [currentId],
  );

  const readFile = (file: File): Promise<FileAttachment> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) =>
        resolve({
          name: file.name,
          type: file.type,
          content: (e.target?.result as string) ?? '',
          size: file.size,
        });
      reader.onerror = reject;
      reader.readAsText(file);
    });

  const handleFileSelect = useCallback(async (files: FileList) => {
    const loaded = await Promise.all(Array.from(files).slice(0, 3).map(readFile));
    setAttachments((prev) => [...prev, ...loaded].slice(0, 3));
  }, []);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) await handleFileSelect(e.dataTransfer.files);
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() && attachments.length === 0) return;

      let sessionId = currentId;
      if (!sessionId) {
        sessionId = genId();
        setCurrentId(sessionId);
      }

      const fileContext =
        attachments.length > 0
          ? attachments.map((f) => `=== File: ${f.name} ===\n${f.content}`).join('\n\n')
          : undefined;

      const userMsg: Message = {
        id: genId(),
        role: 'user',
        content: text || '(See attached files)',
        attachments: attachments.length > 0 ? [...attachments] : undefined,
        timestamp: Date.now(),
      };

      const thinkingMsg: Message = {
        id: genId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isGenerating: true,
      };

      const withThinking = [...messages, userMsg, thinkingMsg];
      setMessages(withThinking);
      setAttachments([]);
      setIsLoading(true);

      const sessionTitle = (text || attachments[0]?.name || 'Chat').slice(0, 50);
      upsertSession(sessionId, [...messages, userMsg], sessionTitle);

      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      try {
        const res = await fetch(`${BASE_URL}/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ message: text || '(See attached files)', context: fileContext, history }),
        });

        if (!res.ok) throw new Error(`API ${res.status}`);

        const data = (await res.json()) as {
          answer: string;
          visualization?: VizData;
          followUpQuestions?: string[];
          source: string;
        };

        const assistantMsg: Message = {
          id: genId(),
          role: 'assistant',
          content: data.answer,
          visualization: data.visualization,
          followUpQuestions: data.followUpQuestions,
          timestamp: Date.now(),
        };

        const final = [...messages, userMsg, assistantMsg];
        setMessages(final);
        upsertSession(sessionId, final, sessionTitle);
      } catch {
        const errMsg: Message = {
          id: genId(),
          role: 'assistant',
          content: 'Sorry, I ran into an error reaching the AI. Please try again.',
          timestamp: Date.now(),
        };
        const final = [...messages, userMsg, errMsg];
        setMessages(final);
        upsertSession(sessionId, final, sessionTitle);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, attachments, currentId, upsertSession],
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Navbar />

      <div className="flex flex-1 min-h-0">
        {/* Collapsed sidebar toggle strip */}
        {!sidebarOpen && (
          <div className="flex flex-col items-center gap-1.5 py-3 px-1 border-r border-border bg-card/30 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Open history"
              onClick={() => setSidebarOpen(true)}
            >
              <ChevronRight size={15} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="New chat"
              onClick={startNewChat}
            >
              <Plus size={15} />
            </Button>
            <div className="w-px h-4 bg-border mx-auto" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Chat history"
            >
              <MessageSquare size={15} className="text-muted-foreground" />
            </Button>
          </div>
        )}

        <ChatSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sessions={sessions}
          currentId={currentId}
          onSelect={selectSession}
          onNew={startNewChat}
          onDelete={deleteSession}
        />

        {/* Main chat column */}
        <div
          className="flex flex-col flex-1 min-h-0 min-w-0 relative"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/80 backdrop-blur pointer-events-none border-2 border-dashed border-primary rounded-lg m-2">
              <Paperclip size={44} className="text-primary mb-3" />
              <p className="text-lg font-semibold text-primary">Drop files to attach</p>
              <p className="text-sm text-muted-foreground mt-1">
                .txt, .csv, .json, .md files for AI context
              </p>
            </div>
          )}

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="max-w-3xl mx-auto px-4 py-6 min-h-full flex flex-col">
              {messages.length === 0 ? (
                <WelcomeScreen onSuggestion={sendMessage} />
              ) : (
                <div className="space-y-6">
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} onFollowUp={sendMessage} />
                  ))}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>
          </div>

          <ChatInputBar
            onSend={sendMessage}
            onFileSelect={handleFileSelect}
            attachments={attachments}
            onRemoveFile={(idx) => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
