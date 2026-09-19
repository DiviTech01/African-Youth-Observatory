import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
  /** Shown in place of the default panel. Receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches a render-time error and shows a recoverable panel instead of a blank
 * page.
 *
 * Without one, React unmounts the whole tree when any component throws, and the
 * visitor gets a white screen with nothing to click — the same symptom as a
 * failed deploy, and indistinguishable from it. One malformed API response was
 * enough to do it.
 *
 * `reset` re-renders the subtree rather than reloading the document, so a
 * transient failure costs a click instead of a cold start on the Render API.
 */
class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // The console is the only sink today — the platform has no error monitoring
    // wired up. When Sentry (or similar) lands, report it here as well; the
    // component stack is the part that makes these diagnosable.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/30">
            <AlertTriangle className="h-7 w-7 text-destructive" aria-hidden="true" />
          </div>

          <h1 className="text-2xl font-semibold mb-3">This page hit an error</h1>
          <p className="text-sm text-muted-foreground mb-2">
            Something in this view failed to render. The rest of the platform is unaffected, and your
            data is untouched.
          </p>
          <p className="text-xs text-muted-foreground mb-8">
            If it keeps happening, please tell us at{' '}
            <a className="text-primary hover:underline" href="mailto:info@africanyouthobservatory.org">
              info@africanyouthobservatory.org
            </a>{' '}
            and mention what you were looking at.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={this.reset} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Try again
            </Button>
            <Button variant="outline" asChild className="gap-1.5">
              <a href="/dashboard">
                <Home className="h-3.5 w-3.5" /> Back to the dashboard
              </a>
            </Button>
          </div>

          {/* The message only — never a stack trace, which can carry internal
              paths and query shapes into a screenshot. */}
          {import.meta.env.DEV && (
            <pre className="mt-8 text-left text-[11px] text-muted-foreground whitespace-pre-wrap break-words">
              {error.message}
            </pre>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
