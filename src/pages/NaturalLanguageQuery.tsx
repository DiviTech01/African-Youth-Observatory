import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, BarChart3, ChevronDown, ChevronUp, Brain, Cpu, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ClaudeChatInput } from '@/components/ui/claude-style-ai-input';
import type { FileWithPreview, PastedContent } from '@/components/ui/claude-style-ai-input';

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
  "How has youth unemployment changed in North Africa since 2010?",
  "Which countries have the best AYC compliance and what policies do they have?",
  "What is the correlation between education spending and youth literacy across Africa?",
  "Show me the top 10 countries for internet penetration among youth",
  "What are Rwanda's strengths and weaknesses in the Youth Index?",
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

function VisualizationRenderer({ viz }: { viz: AiVisualization }) {
  const tooltipStyle = {
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
  };

  switch (viz.type) {
    case 'bar_chart':
      return (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={viz.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} />
            <YAxis tick={{ fontSize: 11, fill: '#888' }} label={viz.yAxis ? { value: viz.yAxis, angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 11 } } : undefined} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#D4A017" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    case 'line_chart':
      return (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={viz.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey={viz.data[0]?.year !== undefined ? 'year' : 'name'} tick={{ fontSize: 11, fill: '#888' }} />
            <YAxis tick={{ fontSize: 11, fill: '#888' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="value" stroke="#D4A017" strokeWidth={2} dot={{ fill: '#D4A017' }} />
          </LineChart>
        </ResponsiveContainer>
      );
    case 'radar_chart':
      return (
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={viz.data}>
            <PolarGrid stroke="#333" />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} />
            <PolarRadiusAxis tick={{ fontSize: 10, fill: '#888' }} />
            <Radar dataKey="value" stroke="#D4A017" fill="#D4A017" fillOpacity={0.3} />
          </RadarChart>
        </ResponsiveContainer>
      );
    case 'table':
      return (
        <div className="overflow-x-auto">
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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

const NaturalLanguageQuery = () => {
  const [displayedText, setDisplayedText] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [showCitations, setShowCitations] = useState(false);
  const typingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTyping = useCallback(() => {
    if (typingInterval.current) {
      clearInterval(typingInterval.current);
      typingInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTyping();
  }, [clearTyping]);

  const handleQuery = useCallback(
    async (q: string) => {
      clearTyping();
      setLastQuery(q);
      setDisplayedText('');
      setShowExtras(false);
      setShowCitations(false);
      setIsTyping(true);
      setResult(null);

      const apiBase = import.meta.env.VITE_API_URL || '/api';
      let queryResult: QueryResult;
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
          throw new Error('API error');
        }
      } catch {
        queryResult = {
          answer: `I wasn't able to connect to the AI service right now. Please try again in a moment, or try a more specific question like "What is the youth unemployment rate in Nigeria?"`,
          keyFindings: [],
          dataCitations: [],
          visualization: null,
          followUpQuestions: suggestedQuestions.slice(0, 3),
          confidence: 0.3,
          dataAvailability: 'limited',
          source: 'rule-based',
        };
      }

      setResult(queryResult);

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

  const handleSendMessage = (message: string, _files: FileWithPreview[], _pastedContent: PastedContent[]) => {
    if (message.trim()) {
      handleQuery(message.trim());
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
          <div className="text-center pt-16 pb-8">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent mb-3">
              What can I help you explore?
            </h1>
            <p className="text-[#A89070] max-w-lg mx-auto">
              Ask questions about African youth data. Get instant insights with narrative answers and visualizations.
            </p>
          </div>
        )}

        {/* Suggested Questions - only before first query */}
        {!result && (
          <div className="flex flex-wrap justify-center gap-2 mb-8 px-4 max-w-3xl mx-auto">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleQuery(q)}
                className="px-4 py-2 rounded-xl bg-white/[0.05] border border-gray-800 text-sm text-gray-300 hover:bg-white/[0.08] hover:border-gray-700 transition-all text-left"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="flex-1 px-4 md:px-6 max-w-3xl mx-auto w-full mb-8">
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
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="h-4 w-4 text-[#D4A017]" />
                      <span className="text-xs text-gray-400">{result.visualization.title}</span>
                    </div>
                    <VisualizationRenderer viz={result.visualization} />
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

        {/* Claude-style AI Input - pinned to bottom */}
        <div className="sticky bottom-0 px-4 pb-6 pt-4 bg-gradient-to-t from-background via-background to-transparent">
          <ClaudeChatInput
            onSendMessage={handleSendMessage}
            placeholder="Ask anything about African youth data..."
            maxFiles={5}
            maxFileSize={10 * 1024 * 1024}
          />
        </div>
      </div>
    </div>
  );
};

export default NaturalLanguageQuery;
