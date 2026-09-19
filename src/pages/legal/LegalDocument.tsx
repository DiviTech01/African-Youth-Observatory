import React from 'react';
import { Link } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { LEGAL_LAST_UPDATED } from '@/config/legal';

export interface LegalSection {
  /** Stable anchor id, used by the contents list and by deep links. */
  id: string;
  heading: string;
  body: React.ReactNode;
}

interface LegalDocumentProps {
  title: string;
  summary: string;
  sections: LegalSection[];
  /** Overrides the shared date for a document revised on its own schedule. */
  lastUpdated?: string;
}

/**
 * Shared shell for the four legal documents.
 *
 * The documents are English-only on purpose. The rest of the site ships five
 * languages, but a machine translation of a binding document creates five
 * differing sets of obligations and no way to say which governs. The header
 * says so plainly instead of leaving a reader of another language to assume the
 * page simply failed to translate.
 */
const LegalDocument: React.FC<LegalDocumentProps> = ({ title, summary, sections, lastUpdated }) => (
  <>
    <header className="gradient-hero py-8 md:py-12">
      <div className="container px-4 md:px-6">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-2">
            <Scale className="h-8 w-8 text-primary" aria-hidden="true" />
            <h1 className="section-title">{title}</h1>
          </div>
          <p className="section-description">{summary}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Last updated {lastUpdated ?? LEGAL_LAST_UPDATED}. This document is published in English
            only; it governs regardless of the language you are browsing the site in.
          </p>
        </div>
      </div>
    </header>

    <div className="py-8 md:py-12">
      <div className="container px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <nav aria-label="Contents" className="mb-10 rounded-lg border bg-muted/40 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Contents
            </h2>
            <ol className="space-y-1 text-sm">
              {sections.map((section, i) => (
                <li key={section.id}>
                  <a className="text-primary hover:underline" href={`#${section.id}`}>
                    {i + 1}. {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-10">
            {sections.map((section, i) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-xl font-semibold mb-3">
                  {i + 1}. {section.heading}
                </h2>
                <div className="space-y-3 text-muted-foreground leading-relaxed [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_table]:w-full [&_th]:text-left [&_th]:py-2 [&_th]:pr-4 [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top [&_th]:border-b [&_td]:border-b [&_th]:text-foreground">
                  {section.body}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 border-t pt-6 text-sm text-muted-foreground">
            <p className="flex flex-wrap gap-x-4 gap-y-2">
              <Link className="text-primary hover:underline" to="/privacy">
                Privacy Policy
              </Link>
              <Link className="text-primary hover:underline" to="/terms">
                Terms of Service
              </Link>
              <Link className="text-primary hover:underline" to="/data-licensing">
                Data Licensing
              </Link>
              <Link className="text-primary hover:underline" to="/cookies">
                Cookie Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </>
);

export default LegalDocument;
