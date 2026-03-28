import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface ChangelogEntry {
  date: string;
  version: string;
  title: string;
  description: string[];
}

const changelog: ChangelogEntry[] = [
  {
    date: '2026-03-28',
    version: 'v0.8.0',
    title: 'AI Insights Engine',
    description: [
      'AI-powered data insights with natural language queries',
      'Anomaly detection across youth indicators',
      'Automated trend analysis and forecasting',
      'Smart recommendations for policy research',
    ],
  },
  {
    date: '2026-03-25',
    version: 'v0.7.0',
    title: 'Policy Monitor',
    description: [
      'African Youth Charter (AYC) compliance tracking',
      'Interactive policy implementation timeline',
      'Country-level policy comparison matrix',
      'Automated compliance scoring dashboard',
    ],
  },
  {
    date: '2026-03-21',
    version: 'v0.6.0',
    title: 'Expert Directory',
    description: [
      'Searchable directory of youth development experts',
      'Expert profile pages with publications and expertise',
      'Expert registration and verification workflow',
      'Filter by country, specialization, and availability',
    ],
  },
  {
    date: '2026-03-17',
    version: 'v0.5.0',
    title: 'Dashboard Builder',
    description: [
      'Custom widget grid with drag-and-drop layout',
      'Configurable chart types and data sources',
      'Save and share custom dashboard configurations',
      'Real-time data refresh and auto-update',
    ],
  },
  {
    date: '2026-03-12',
    version: 'v0.4.0',
    title: 'Core Platform',
    description: [
      'Data Explorer with advanced filtering and search',
      'Country Profiles for all 54 African nations',
      'African Youth Index (AYI) rankings and scoring',
      'Light and dark mode theme support',
    ],
  },
];

export function WhatsNew() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9 relative"
          aria-label="What's New"
        >
          <Sparkles className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            What's New
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 pb-4">
            {changelog.map((entry) => (
              <div
                key={entry.version}
                className="relative pl-6 border-l-2 border-border hover:border-primary/50 transition-colors"
              >
                <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-primary" />
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs font-mono">
                    {entry.version}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {entry.date}
                  </span>
                </div>
                <h4 className="text-sm font-semibold mb-2">{entry.title}</h4>
                <ul className="space-y-1">
                  {entry.description.map((item, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-primary mt-1.5 h-1 w-1 rounded-full bg-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default WhatsNew;
