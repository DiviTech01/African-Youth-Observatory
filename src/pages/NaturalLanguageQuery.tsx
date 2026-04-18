import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, BarChart3, ChevronDown, ChevronUp, Brain, Cpu, TrendingUp, Send, Download } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface AiVisualization {
  type: 'bar_chart' | 'line_chart' | 'radar_chart' | 'pie_chart' | 'scatter_plot' | 'table' | 'stat_cards';
  title: string;
  data: any[];
  xAxis?: string;
  yAxis?: string;
  headers?: string[];
  rows?: string[][];
}

interface AiDataCitation {
  indicator: string;
  country?: string;
  value: number;
  year: number;
  source?: string;
}

interface QueryResult {
  answer: string;
  keyFindings: string[];
  dataCitations: AiDataCitation[];
  visualization: AiVisualization | null;
  followUpQuestions: string[];
  confidence: number;
  dataAvailability: 'full' | 'partial' | 'limited';
  source: 'ai' | 'rule-based';
  processingTime?: number;
}

const suggestedQuestions = [
  "Which 5 African countries have the highest Youth Index scores and why?",
  "Compare Nigeria and Kenya across education, employment, and health indicators",
  "What are the biggest data gaps in Southern Africa?",
];

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

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence > 0.8) return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">High confidence</Badge>;
  if (confidence > 0.5) return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Medium confidence</Badge>;
  return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Low confidence</Badge>;
}

function SourceBadge({ source }: { source: 'ai' | 'rule-based' }) {
  if (source === 'ai') return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 gap-1"><Brain className="h-3 w-3" />AI-powered</Badge>;
  return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 gap-1"><Cpu className="h-3 w-3" />Rule-based</Badge>;
}

/** Download an SVG element as a .svg file */
function downloadVisualizationSvg(containerId: string, filename: string) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const svg = container.querySelector('svg');
  if (!svg) return;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  // Apply a dark background so it looks the same when opened externally
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

/** Custom glass-morphism tooltip for Recharts */
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

function VisualizationRenderer({ viz, id }: { viz: AiVisualization; id: string }) {
  switch (viz.type) {
    case 'bar_chart':
      return (
        <div id={id}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={viz.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} label={viz.yAxis ? { value: viz.yAxis, angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 11 } } : undefined} />
              <Tooltip content={<GlassTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />
              <Bar dataKey="value" fill="#D4A017" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    case 'line_chart':
      return (
        <div id={id}>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={viz.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey={viz.data[0]?.year !== undefined ? 'year' : 'name'} tick={{ fontSize: 11, fill: '#888' }} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} />
              <Tooltip content={<GlassTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />
              <Line type="monotone" dataKey="value" stroke="#D4A017" strokeWidth={2} dot={{ fill: '#D4A017' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    case 'radar_chart':
      return (
        <div id={id}>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={viz.data}>
              <PolarGrid stroke="#333" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} />
              <PolarRadiusAxis tick={{ fontSize: 10, fill: '#888' }} />
              <Tooltip content={<GlassTooltip />} />
              <Radar dataKey="value" stroke="#D4A017" fill="#D4A017" fillOpacity={0.3} />
            </RadarChart>
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

/** Try to extract structured visualization JSON from an AI text response */
function parseVisualizationFromText(text: string): AiVisualization | null {
  // Look for ```json ... ``` blocks that contain visualization data
  const jsonBlockRegex = /```json\s*([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = jsonBlockRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.type && parsed.data && Array.isArray(parsed.data)) {
        return {
          type: parsed.type,
          title: parsed.title || 'Visualization',
          data: parsed.data,
          xAxis: parsed.xAxis,
          yAxis: parsed.yAxis,
          headers: parsed.headers,
          rows: parsed.rows,
        };
      }
    } catch {
      // not valid JSON, skip
    }
  }
  return null;
}

/** Strip visualization JSON blocks from the answer text so they don't render as raw code */
function stripVisualizationBlocks(text: string): string {
  return text.replace(/```json\s*\{[\s\S]*?"type"\s*:\s*"(bar_chart|line_chart|radar_chart|pie_chart|scatter_plot|table|stat_cards)"[\s\S]*?```/g, '').trim();
}

const NaturalLanguageQuery = () => {
  const [displayedText, setDisplayedText] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [showCitations, setShowCitations] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const typingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const vizContainerId = useRef(`viz-${Date.now()}`);

  const clearTyping = useCallback(() => {
    if (typingInterval.current) {
      clearInterval(typingInterval.current);
      typingInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTyping();
  }, [clearTyping]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }
  }, [inputValue]);

  const handleQuery = useCallback(
    async (q: string) => {
      clearTyping();
      setLastQuery(q);
      setDisplayedText('');
      setShowExtras(false);
      setShowCitations(false);
      setIsTyping(true);
      setIsLoading(true);
      setResult(null);
      vizContainerId.current = `viz-${Date.now()}`;

      const apiBase = import.meta.env.VITE_API_URL || '/api';
      let queryResult: QueryResult;

      // ------ Try 1: /ai/chat (Claude-powered) ------
      try {
        const res = await fetch(`${apiBase}/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: q,
            context: 'African youth data analysis platform. The user is asking about youth indicators, demographics, education, employment, health, and policy compliance across African countries.',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const rawAnswer: string = data.answer || 'No answer available.';
          // Try to parse a visualization from the AI text if none was returned explicitly
          const parsedViz = data.visualization || parseVisualizationFromText(rawAnswer);
          const cleanAnswer = parsedViz && !data.visualization ? stripVisualizationBlocks(rawAnswer) : rawAnswer;
          queryResult = {
            answer: cleanAnswer,
            keyFindings: data.keyFindings || [],
            dataCitations: data.dataCitations || [],
            visualization: parsedViz,
            followUpQuestions: data.followUpQuestions || [],
            confidence: data.confidence ?? 0.85,
            dataAvailability: data.dataAvailability || 'partial',
            source: data.source || 'ai',
            processingTime: data.processingTime,
          };
        } else {
          throw new Error('AI endpoint returned non-OK');
        }
      } catch {
        // ------ Try 2: /nlq/query (legacy rule-based fallback) ------
        try {
          const res = await fetch(`${apiBase}/nlq/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: q }),
          });
          if (res.ok) {
            const data = await res.json();
            queryResult = {
              answer: data.answer || 'No answer available.',
              keyFindings: data.keyFindings || [],
              dataCitations: data.dataCitations || [],
              visualization: data.visualization || null,
              followUpQuestions: data.followUpQuestions || [],
              confidence: data.confidence || 0.5,
              dataAvailability: data.dataAvailability || 'partial',
              source: data.source || 'rule-based',
              processingTime: data.processingTime,
            };
          } else {
            throw new Error('NLQ endpoint returned non-OK');
          }
        } catch {
          // ------ Try 3: Offline fallback ------
          queryResult = {
            answer:
              `It looks like both the AI service and the query engine are unavailable right now. This usually means the backend server isn't running or there's a network issue.\n\n**What you can try:**\n- Check that the API server is running\n- Verify your internet connection\n- Refresh the page and try again\n\nIn the meantime, you can still browse the data dashboards and country profiles directly.`,
            keyFindings: [],
            dataCitations: [],
            visualization: null,
            followUpQuestions: suggestedQuestions,
            confidence: 0,
            dataAvailability: 'limited',
            source: 'rule-based',
          };
        }
      }

      setResult(queryResult);
      setIsLoading(false);

      let idx = 0;
      const text = queryResult.answer;
      typingInterval.current = setInterval(() => {
        idx++;
        setDisplayedText(text.slice(0, idx));
        if (idx >= text.length) {
          clearTyping();
          setIsTyping(false);
          setShowExtras(true);
        }
      }, 10);
    },
    [clearTyping],
  );

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;
    setInputValue('');
    handleQuery(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative min-h-[80vh] flex flex-col">
      {/* Grid BG */}
      <div
        className="absolute inset-0 opacity-20 w-full
        bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)]
        bg-[size:6rem_5rem]
        [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_30%,transparent_100%)]"
      />

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        {!result && (
          <div className="text-center pt-16 pb-6">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent mb-3">
              What can I help you explore?
            </h1>
            <p className="text-[#A89070] max-w-lg mx-auto">
              Ask questions about African youth data. Get instant insights with narrative answers and visualizations.
            </p>
          </div>
        )}

        {/* Chat input — always at the TOP */}
        <div className="px-4 pt-4 pb-2 max-w-3xl mx-auto w-full">
          <div className="relative flex items-end gap-2 bg-white/[0.04] border border-gray-800 rounded-2xl px-4 py-3 focus-within:border-[#D4A017]/40 transition-colors">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about African youth data..."
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 resize-none outline-none max-h-40 leading-relaxed disabled:opacity-50"
            />
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim() || isLoading}
              className="flex-shrink-0 p-2 rounded-xl bg-[#D4A017] text-black hover:bg-[#E0B030] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Suggested Questions — below chat input, only before first query */}
        {!result && !isLoading && (
          <div className="flex flex-wrap justify-center gap-2 pt-3 pb-6 px-4 max-w-3xl mx-auto">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => { setInputValue(''); handleQuery(q); }}
                className="px-4 py-2 rounded-xl bg-white/[0.03] border border-gray-800/60 text-xs text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] hover:border-gray-700 transition-all text-left"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !result && (
          <div className="flex items-center gap-3 px-4 max-w-3xl mx-auto w-full mt-6">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#D4A017]/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-[#D4A017] animate-pulse" />
            </div>
            <span className="text-sm text-gray-400 animate-pulse">Thinking...</span>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="flex-1 px-4 md:px-6 max-w-3xl mx-auto w-full mb-8 mt-2">
            {/* User query */}
            <div className="flex justify-end mb-6">
              <div className="bg-[#D4A017]/20 border border-[#D4A017]/30 rounded-2xl rounded-tr-sm px-4 py-3 max-w-md">
                <p className="text-sm text-white">{lastQuery}</p>
              </div>
            </div>

            {/* AI response */}
            <div className="flex gap-3 mb-6">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#D4A017]/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-[#D4A017]" />
              </div>
              <div className="flex-1 space-y-4">
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <SourceBadge source={result.source} />
                  <ConfidenceBadge confidence={result.confidence} />
                  {result.processingTime !== undefined && (
                    <span className="text-xs text-gray-500">{result.processingTime.toFixed(1)}s</span>
                  )}
                </div>

                {/* Answer text with typing animation */}
                <div className="text-sm text-gray-300 leading-relaxed">
                  <span dangerouslySetInnerHTML={{ __html: renderMarkdown(displayedText) }} />
                  {isTyping && <span className="inline-block w-1.5 h-4 bg-[#D4A017] ml-0.5 animate-pulse" />}
                </div>

                {/* Key Findings */}
                {showExtras && result.keyFindings.length > 0 && (
                  <div className="bg-[#D4A017]/5 border border-[#D4A017]/20 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-[#D4A017] mb-2 uppercase tracking-wider">Key Findings</h4>
                    <ul className="space-y-1.5">
                      {result.keyFindings.map((f, i) => (
                        <li key={i} className="text-sm text-gray-300 flex gap-2">
                          <span className="text-[#D4A017] mt-0.5">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Visualization */}
                {showExtras && result.visualization && (
                  <div className="bg-white/[0.03] border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-[#D4A017]" />
                        <span className="text-xs text-gray-400">{result.visualization.title}</span>
                      </div>
                      {result.visualization.type !== 'table' && result.visualization.type !== 'stat_cards' && (
                        <button
                          onClick={() => downloadVisualizationSvg(vizContainerId.current, result.visualization?.title?.replace(/\s+/g, '_') || 'chart')}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-600 transition-all"
                          title="Download as SVG"
                        >
                          <Download className="h-3 w-3" />
                          SVG
                        </button>
                      )}
                    </div>
                    <VisualizationRenderer viz={result.visualization} id={vizContainerId.current} />
                  </div>
                )}

                {/* Data Citations (collapsible) */}
                {showExtras && result.dataCitations.length > 0 && (
                  <div className="border border-gray-800 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setShowCitations(!showCitations)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-gray-400 hover:bg-white/[0.02] transition-colors"
                    >
                      <span>Data Sources ({result.dataCitations.length} citations)</span>
                      {showCitations ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    {showCitations && (
                      <div className="px-4 pb-3 space-y-1.5">
                        {result.dataCitations.map((c, i) => (
                          <div key={i} className="text-xs text-gray-500">
                            {c.country ? `${c.country} — ` : ''}{c.indicator}: {c.value} ({c.year}){c.source ? ` — ${c.source}` : ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Follow-up questions */}
                {showExtras && result.followUpQuestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {result.followUpQuestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleQuery(q)}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-gray-800 text-xs text-gray-400 hover:text-white hover:border-gray-700 transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NaturalLanguageQuery;
