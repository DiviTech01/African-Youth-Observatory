import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, MessageSquare, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
      'What is the gender gap in Nigerian youth employment?',
    ],
  },
  'Compare education spending in East Africa': {
    narrative:
      'Education spending across East African nations varies significantly as a share of GDP. Kenya leads the region at 5.3% of GDP, followed by Tanzania at 3.7%, Uganda at 3.1%, Rwanda at 3.6%, and Ethiopia at 4.7%. Kenya\'s higher allocation reflects its commitment to free primary and subsidized secondary education. Rwanda, despite a lower GDP share, has achieved notable efficiency gains through technology integration. Ethiopia\'s spending has been impacted by recent fiscal pressures but remains relatively high.',
    chartData: [
      { name: 'Kenya', value: 5.3 },
      { name: 'Ethiopia', value: 4.7 },
      { name: 'Tanzania', value: 3.7 },
      { name: 'Rwanda', value: 3.6 },
      { name: 'Uganda', value: 3.1 },
    ],
    chartLabel: 'Education Spending (% of GDP)',
    followUps: [
      'Which East African country has the best learning outcomes?',
      'How has education spending changed over the last decade?',
      'What is the teacher-to-student ratio in East Africa?',
    ],
  },
  'Which country has the highest youth literacy rate?': {
    narrative:
      'Seychelles leads the continent with a youth literacy rate of 98.4%, followed closely by Mauritius at 97.8% and Libya at 96.1%. Among Sub-Saharan nations, South Africa (97.2%) and Botswana (96.5%) rank highest. These high-performing countries share common factors: sustained investment in universal primary education, compulsory schooling laws, and relatively smaller youth populations. In contrast, the continental average remains around 75.4%, with significant gaps in the Sahel region.',
    chartData: [
      { name: 'Seychelles', value: 98.4 },
      { name: 'Mauritius', value: 97.8 },
      { name: 'South Africa', value: 97.2 },
      { name: 'Botswana', value: 96.5 },
      { name: 'Libya', value: 96.1 },
      { name: 'Tunisia', value: 95.8 },
      { name: 'Kenya', value: 91.2 },
      { name: 'Ghana', value: 86.7 },
    ],
    chartLabel: 'Youth Literacy Rate (%)',
    followUps: [
      'Which country improved youth literacy the most?',
      'What is the gender gap in youth literacy across Africa?',
      'How does urban vs. rural literacy compare?',
      'What programs drive literacy improvement?',
    ],
  },
};

const exampleQueries = [
  'What is the youth unemployment rate in Nigeria?',
  'Compare education spending in East Africa',
  'Which country has the highest youth literacy rate?',
];

const NaturalLanguageQuery = () => {
  const [query, setQuery] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showChart, setShowChart] = useState(false);
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
    (q: string) => {
      clearTyping();
      setQuery(q);
      setDisplayedText('');
      setShowChart(false);
      setIsTyping(true);

      const matchedResult = queryDatabase[q] ?? {
        narrative: `Based on the available data, your query "${q}" returned relevant insights from the African Youth Database. The data suggests significant variation across countries and regions. For more precise results, try one of the suggested queries below.`,
        chartData: [
          { name: 'North Africa', value: 68 },
          { name: 'West Africa', value: 54 },
          { name: 'East Africa', value: 62 },
          { name: 'Central Africa', value: 41 },
          { name: 'Southern Africa', value: 71 },
        ],
        chartLabel: 'Regional Index Score',
        followUps: [
          'What is the youth unemployment rate in Nigeria?',
          'Compare education spending in East Africa',
          'Which country has the highest youth literacy rate?',
        ],
      };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleQuery(query.trim());
    }
  };

  return (
    <>
      <header className="gradient-hero py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <h1 className="section-title">Ask the Data</h1>
            </div>
            <p className="section-description">
              Query African youth data using natural language. Get instant insights with narrative answers and visualizations.
            </p>
          </div>
        </div>
      </header>

      <div className="py-6 md:py-8">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto">
          {/* Search Bar - Glassmorphic Card */}
          <Card className="mb-8 backdrop-blur-md bg-background/70 border border-border/50 shadow-lg">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask anything about African youth data..."
                    className="pl-10 h-12 text-base bg-background/80"
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 px-6 gap-2">
                  <Sparkles className="h-4 w-4" />
                  Ask
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Example Queries */}
          {!result && (
            <div className="mb-8">
              <p className="text-sm text-muted-foreground mb-3 text-center">Try an example query:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {exampleQueries.map((eq) => (
                  <Button
                    key={eq}
                    variant="outline"
                    className="text-sm h-auto py-2 px-4 whitespace-normal text-left"
                    onClick={() => handleQuery(eq)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2 shrink-0" />
                    {eq}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Result Area */}
          {result && (
            <div className="space-y-6">
              {/* Narrative Answer */}
              <Card className="backdrop-blur-md bg-background/70 border border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm leading-relaxed">
                        {displayedText}
                        {isTyping && <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chart */}
              {showChart && (
                <Card className="backdrop-blur-md bg-background/70 border border-border/50 animate-in fade-in duration-500">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-sm">{result.chartLabel}</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={result.chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Follow-up Questions */}
              {showChart && (
                <div className="animate-in fade-in duration-500">
                  <p className="text-sm text-muted-foreground mb-3">Follow-up questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.followUps.map((fq) => (
                      <Badge
                        key={fq}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary/15 transition-colors py-2 px-3 text-sm font-normal"
                        onClick={() => handleQuery(fq)}
                      >
                        {fq}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NaturalLanguageQuery;
