import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const exampleQueries = [
  "Youth unemployment rate in Nigeria 2023",
  "Compare literacy rates across East Africa",
  "Education spending trends in Sub-Saharan Africa",
];

const NLQSearchBar = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/ask?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleChipClick = (example: string) => {
    navigate(`/ask?q=${encodeURIComponent(example)}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass-card rounded-2xl p-6 md:p-8"
    >
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        Ask the Data
      </h3>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything about African youth data..."
          className="flex-1 rounded-lg border border-border bg-background/60 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Ask</span>
        </button>
      </form>
      <div className="flex flex-wrap gap-2 mt-4">
        {exampleQueries.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => handleChipClick(example)}
            className="rounded-full border border-border bg-background/40 px-3 py-1 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
          >
            {example}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default NLQSearchBar;
