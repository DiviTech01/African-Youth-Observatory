import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ClaudeChatInput } from '@/components/ui/claude-style-ai-input';
import type { FileWithPreview, PastedContent } from '@/components/ui/claude-style-ai-input';

interface QueryResult {
  narrative: string;
  chartData: { name: string; value: number }[];
  chartLabel: string;
  followUps: string[];
}

const queryDatabase: Record<string, QueryResult> = {
  'What is the youth unemployment rate in Nigeria?': {
    narrative:
      'The youth unemployment rate in Nigeria stands at approximately 42.5% as of 2024, one of the highest in Sub-Saharan Africa. This figure encompasses individuals aged 15-35 who are actively seeking employment but unable to find work. The rate has risen steadily from 36.5% in 2020, driven by rapid population growth and limited formal sector job creation. Urban areas report higher rates (48.2%) compared to rural regions (34.1%), though rural underemployment remains a significant concern.',
    chartData: [
      { name: '2020', value: 36.5 },
      { name: '2021', value: 38.2 },
      { name: '2022', value: 40.1 },
      { name: '2023', value: 41.8 },
      { name: '2024', value: 42.5 },
    ],
    chartLabel: 'Youth Unemployment Rate (%)',
    followUps: [
      'How does Nigeria compare to Ghana and Kenya?',
      'What programs address youth unemployment in Nigeria?',
      'What is the NEET rate in West Africa?',
    ],
  },
  'Compare education spending in East Africa': {
    narrative:
      'Education spending as a percentage of GDP varies significantly across East African nations. Kenya leads the region at 5.3% of GDP, followed by Tanzania at 3.4%. Rwanda allocates 3.6% despite its smaller economy, reflecting a strong commitment to education. Uganda spends 2.7%, while Burundi and South Sudan trail at 2.1% and 0.8% respectively.',
    chartData: [
      { name: 'Kenya', value: 5.3 },
      { name: 'Rwanda', value: 3.6 },
      { name: 'Tanzania', value: 3.4 },
      { name: 'Uganda', value: 2.7 },
      { name: 'Burundi', value: 2.1 },
      { name: 'S. Sudan', value: 0.8 },
    ],
    chartLabel: 'Education Spending (% of GDP)',
    followUps: [
      'How does East Africa compare to West Africa in education spending?',
      'What is the correlation between education spending and literacy rates?',
      'Which country improved education spending the most since 2015?',
    ],
  },
  'Which country has the highest youth literacy rate?': {
    narrative:
      'Seychelles leads Africa with a youth literacy rate of 98.4%, followed closely by Libya at 99.6% (pre-conflict data) and Equatorial Guinea at 97.8%. Among larger nations, South Africa reports 94.3% and Tunisia 95.8%. The continental average stands at approximately 73.4%, with significant variation between regions.',
    chartData: [
      { name: 'Seychelles', value: 98.4 },
      { name: 'S. Africa', value: 94.3 },
      { name: 'Tunisia', value: 95.8 },
      { name: 'Kenya', value: 91.2 },
      { name: 'Ghana', value: 86.7 },
    ],
    chartLabel: 'Youth Literacy Rate (%)',
    followUps: [
      'Which country improved youth literacy the most?',
      'What is the gender gap in youth literacy across Africa?',
      'How does urban vs. rural literacy compare?',
    ],
  },
};

const exampleQueries = [
  'What is the youth unemployment rate in Nigeria?',
  'Compare education spending in East Africa',
  'Which country has the highest youth literacy rate?',
];

const NaturalLanguageQuery = () => {
  const [displayedText, setDisplayedText] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
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
      setShowChart(false);
      setIsTyping(true);

      // Try API first, fallback to mock
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      let matchedResult: QueryResult;
      try {
        const res = await fetch(`${apiBase}/nlq/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q }),
        });
        if (res.ok) {
          const data = await res.json();
          matchedResult = {
            narrative: data.answer || data.narrative || 'No answer available.',
            chartData: data.chartData?.data || data.visualization?.data || [],
            chartLabel: data.chartData?.label || data.visualization?.title || 'Data',
            followUps: data.followUpQuestions || data.followUps || exampleQueries,
          };
        } else {
          throw new Error('API error');
        }
      } catch {
        // Fallback to mock database
        matchedResult = queryDatabase[q] ?? {
          narrative: `Based on the available data, your query "${q}" returned relevant insights from the African Youth Database. The data suggests significant variation across countries and regions. For more precise results, try one of the suggested queries below.`,
          chartData: [
            { name: 'North Africa', value: 68 },
            { name: 'West Africa', value: 54 },
            { name: 'East Africa', value: 62 },
            { name: 'Central Africa', value: 41 },
            { name: 'Southern Africa', value: 71 },
          ],
          chartLabel: 'Regional Index Score',
          followUps: exampleQueries,
        };
      }

      setResult(matchedResult);

      let idx = 0;
      const text = matchedResult.narrative;
      typingInterval.current = setInterval(() => {
        idx++;
        setDisplayedText(text.slice(0, idx));
        if (idx >= text.length) {
          clearTyping();
          setIsTyping(false);
          setShowChart(true);
        }
      }, 12);
    },
    [clearTyping]
  );

  const handleSendMessage = (message: string, files: FileWithPreview[], pastedContent: PastedContent[]) => {
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

        {/* Example Queries - only before first query */}
        {!result && (
          <div className="flex flex-wrap justify-center gap-2 mb-8 px-4">
            {exampleQueries.map((q) => (
              <button
                key={q}
                onClick={() => handleQuery(q)}
                className="px-4 py-2 rounded-xl bg-white/[0.05] border border-gray-800 text-sm text-gray-300 hover:bg-white/[0.08] hover:border-gray-700 transition-all"
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
                <p className="text-sm text-gray-300 leading-relaxed">
                  {displayedText}
                  {isTyping && <span className="inline-block w-1.5 h-4 bg-[#D4A017] ml-0.5 animate-pulse" />}
                </p>

                {/* Chart */}
                {showChart && result.chartData && (
                  <div className="bg-white/[0.03] border border-gray-800 rounded-xl p-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="h-4 w-4 text-[#D4A017]" />
                      <span className="text-xs text-gray-400">{result.chartLabel}</span>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={result.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                        />
                        <Bar dataKey="value" fill="#D4A017" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Follow-ups */}
                {showChart && result.followUps && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {result.followUps.map((q) => (
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
