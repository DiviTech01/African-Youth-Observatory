
import React from 'react';
import { Link } from 'react-router-dom';
import { Content } from '@/components/cms';
import { useContentText } from '@/contexts/ContentContext';

const NAV_LINKS = [
  { slug: 'home', to: '/', label: 'Home' },
  { slug: 'explore', to: '/explore', label: 'Data Explorer' },
  { slug: 'compare', to: '/compare', label: 'Compare Countries' },
  { slug: 'themes', to: '/themes', label: 'Themes' },
  { slug: 'countries', to: '/countries', label: 'Countries' },
  { slug: 'about', to: '/about', label: 'About' },
];

const RESOURCE_LINKS = [
  { slug: 'glossary', to: '/resources/glossary', label: 'Glossary' },
  { slug: 'methodology', to: '/resources/methodology', label: 'Methodology' },
  { slug: 'faq', to: '/resources/faq', label: 'FAQ' },
  { slug: 'reports', to: '/resources/reports', label: 'Reports' },
  { slug: 'toolkits', to: '/resources/toolkits', label: 'Toolkits' },
];

const Footer = () => {
  const contactEmail = useContentText('footer.contact.email', 'info@africanyouthstats.org');
  const newsletterPlaceholder = useContentText('footer.newsletter.placeholder', 'Your email');

  return (
    <footer className="bg-muted py-8 md:py-12 mt-12 md:mt-16">
      <div className="container px-4 md:px-6 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        <div className="col-span-2 sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-pan-green-500">
              <span className="font-bold text-white">AY</span>
            </div>
            <Content as="span" id="footer.brand.name" fallback="African Youth Stats" className="font-bold text-sm md:text-base" />
          </div>
          <Content
            as="p"
            id="footer.brand.description"
            fallback="The central hub for African youth statistics, supporting research, policy-making, and development initiatives."
            className="text-xs sm:text-sm text-muted-foreground mb-4"
          />
          <div className="flex gap-4">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
          </div>
        </div>

        <div>
          <Content as="h3" id="footer.nav.heading" fallback="Navigation" className="font-medium mb-3 md:mb-4 text-sm md:text-base" />
          <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
            {NAV_LINKS.map((link) => (
              <li key={link.slug}>
                <Link to={link.to} className="hover:text-foreground transition-colors">
                  <Content as="span" id={`footer.nav.${link.slug}`} fallback={link.label} />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <Content as="h3" id="footer.resources.heading" fallback="Resources" className="font-medium mb-3 md:mb-4 text-sm md:text-base" />
          <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
            {RESOURCE_LINKS.map((link) => (
              <li key={link.slug}>
                <Link to={link.to} className="hover:text-foreground transition-colors">
                  <Content as="span" id={`footer.resources.${link.slug}`} fallback={link.label} />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <Content as="h3" id="footer.contact.heading" fallback="Contact" className="font-medium mb-3 md:mb-4 text-sm md:text-base" />
          <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>
              <a href={`mailto:${contactEmail}`} className="hover:text-foreground transition-colors break-all">
                {contactEmail}
              </a>
            </li>
            <li>
              <Link to="/contact" className="hover:text-foreground transition-colors">
                <Content as="span" id="footer.contact.form_link" fallback="Contact Form" />
              </Link>
            </li>
          </ul>

          <Content as="h3" id="footer.newsletter.heading" fallback="Newsletter" className="font-medium mt-4 md:mt-6 mb-3 md:mb-4 text-sm md:text-base" />
          <form className="flex flex-col gap-2">
            <input
              type="email"
              placeholder={newsletterPlaceholder}
              className="px-3 py-2 bg-background border rounded-md text-xs sm:text-sm w-full"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-pan-green-500 text-white rounded-md text-xs sm:text-sm font-medium hover:bg-pan-green-600 transition-colors"
            >
              <Content as="span" id="footer.newsletter.submit" fallback="Subscribe" />
            </button>
          </form>
        </div>
      </div>

      <div className="container px-4 md:px-6 mt-8 md:mt-12 pt-6 border-t border-muted-foreground/20">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <Content
            as="p"
            id="footer.copyright"
            fallback="© 2025 African Youth Statistics Database. All rights reserved."
            className="text-center sm:text-left"
          />
          <div className="flex gap-4 sm:gap-6">
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
              <Content as="span" id="footer.legal.privacy" fallback="Privacy Policy" />
            </Link>
            <Link to="/terms-of-service" className="hover:text-foreground transition-colors">
              <Content as="span" id="footer.legal.terms" fallback="Terms of Service" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
