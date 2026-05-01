import React, { useState } from 'react';
import { Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface NewsletterSignupProps {
  /** Where on the page this form sits — recorded so we know which CTA converts. */
  source: string;
  className?: string;
  variant?: 'inline' | 'card';
  heading?: string;
  subtitle?: string;
}

/**
 * Self-contained newsletter signup. POSTs to /api/newsletter/subscribe and
 * swaps to a "you're in" success state on 2xx. Safe to drop on any landing
 * surface — the only required prop is `source` so the DB row carries
 * provenance.
 */
export const NewsletterSignup: React.FC<NewsletterSignupProps> = ({
  source,
  className = '',
  variant = 'card',
  heading = 'Stay in the loop',
  subtitle = 'Monthly updates on new data, country reports, and PACSDA insights. No spam.',
}) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;
    setStatus('loading');
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
      setErrorMsg('Could not subscribe right now. Please try again in a moment.');
    }
  };

  const wrapperClass =
    variant === 'card'
      ? `rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 sm:p-7 ${className}`
      : className;

  return (
    <div className={wrapperClass}>
      <div className="flex items-center gap-2 mb-2">
        <Mail className="h-4 w-4 text-primary shrink-0" />
        <h3 className="text-sm sm:text-base font-semibold text-foreground">{heading}</h3>
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground mb-4 leading-relaxed">{subtitle}</p>

      {status === 'success' ? (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          You're subscribed. Watch your inbox.
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={status === 'loading'}
            className="flex-1 px-3 py-2 h-10 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={status === 'loading'}
            className="h-10 gap-2"
          >
            {status === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Subscribe
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      )}

      {errorMsg && status === 'error' && (
        <p className="mt-2 text-xs text-destructive">{errorMsg}</p>
      )}
    </div>
  );
};

export default NewsletterSignup;
