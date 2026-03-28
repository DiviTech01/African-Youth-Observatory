import React from 'react';
import { PulseIndicator } from '@/components/PulseIndicator';

interface TickerItem {
  country: string;
  metric: string;
  value: string;
  delta: string;
  positive: boolean;
}

interface LiveDataTickerProps {
  /** Duration in seconds for one full scroll loop */
  speed?: number;
}

const TICKER_DATA: TickerItem[] = [
  { country: 'Nigeria', metric: 'Youth unemployment', value: '23.4%', delta: '-0.3%', positive: true },
  { country: 'Kenya', metric: 'Literacy rate', value: '87.2%', delta: '+1.1%', positive: true },
  { country: 'Rwanda', metric: 'STEM enrollment', value: '18.3%', delta: '+2.4%', positive: true },
  { country: 'South Africa', metric: 'Youth employment', value: '46.1%', delta: '-1.8%', positive: false },
  { country: 'Ghana', metric: 'Secondary completion', value: '72.6%', delta: '+0.9%', positive: true },
  { country: 'Ethiopia', metric: 'Digital access', value: '34.7%', delta: '+3.2%', positive: true },
  { country: 'Tanzania', metric: 'Vocational training', value: '21.5%', delta: '+1.6%', positive: true },
  { country: 'Egypt', metric: 'Youth participation', value: '31.8%', delta: '-0.5%', positive: false },
  { country: 'Senegal', metric: 'Entrepreneurship rate', value: '14.2%', delta: '+2.1%', positive: true },
  { country: 'Morocco', metric: 'University enrollment', value: '39.4%', delta: '+1.3%', positive: true },
  { country: 'Uganda', metric: 'Primary completion', value: '68.9%', delta: '+0.7%', positive: true },
  { country: 'Côte d\'Ivoire', metric: 'Youth poverty rate', value: '41.3%', delta: '-2.1%', positive: true },
];

export const LiveDataTicker: React.FC<LiveDataTickerProps> = ({ speed = 30 }) => {
  const renderItems = (key: string) =>
    TICKER_DATA.map((item, i) => (
      <span key={`${key}-${i}`} className="inline-flex items-center whitespace-nowrap px-4">
        <span className="font-semibold text-foreground">{item.country}:</span>
        <span className="ml-1 text-muted-foreground">{item.metric}</span>
        <span className="ml-1 font-medium text-foreground">{item.value}</span>
        <span
          className={`ml-1 text-xs font-medium ${
            item.positive ? 'text-green-500' : 'text-red-500'
          }`}
        >
          ({item.delta})
        </span>
        {i < TICKER_DATA.length - 1 && (
          <span className="ml-4 text-muted-foreground/40">|</span>
        )}
      </span>
    ));

  return (
    <div className="relative h-9 overflow-hidden border-b bg-muted/30 text-xs flex items-center">
      {/* Gradient fades */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-background to-transparent" />

      {/* Live badge */}
      <div className="absolute left-3 top-1/2 z-20 -translate-y-1/2">
        <PulseIndicator color="green" label="Live" />
      </div>

      {/* Scrolling content — duplicate for seamless loop */}
      <div
        className="flex animate-marquee pl-16"
        style={{
          animationDuration: `${speed}s`,
        }}
      >
        {renderItems('a')}
        {renderItems('b')}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LiveDataTicker;
