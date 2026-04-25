
import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Facebook } from 'lucide-react';
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
  { slug: 'reports', to: '/reports', label: 'Reports' },
  { slug: 'toolkits', to: '/resources/toolkits', label: 'Toolkits' },
];

const LINKEDIN_URL = 'https://www.linkedin.com/company/pan-african-centre-for-social-development-and-accountablity-pacsda-/posts/?feedView=all';
const FACEBOOK_URL = 'https://www.facebook.com/pacsda';
const PACSDA_URL = 'https://pacsda.org';

const Footer = () => {
  const contactEmail = useContentText('footer.contact.email', 'afriyouthstats@pacsda.org');
  const newsletterPlaceholder = useContentText('footer.newsletter.placeholder', 'Your email');

  return (
    <footer className="bg-muted py-8 md:py-12 mt-12 md:mt-16">
      <div className="container px-4 md:px-6 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        <div className="col-span-2 sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-pan-green-500">
              <span className="font-bold text-white">AY</span>
            </div>
            <Content as="span" id="footer.brand.name" fallback="AfriYouthStats" className="font-bold text-sm md:text-base" />
          </div>
          <Content
            as="p"
            id="footer.brand.description"
            fallback="The central hub for African youth statistics, supporting research, policy-making, and development initiatives."
            className="text-xs sm:text-sm text-muted-foreground mb-4"
          />
          <div className="flex gap-4">
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Facebook className="h-5 w-5" />
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
            fallback="© 2026 African Youth Observatory. All rights reserved."
            className="text-center sm:text-left"
          />
          <div className="flex gap-4 sm:gap-6 items-center flex-wrap justify-center">
            <a
              href={PACSDA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              <Content as="span" id="footer.legal.pacsda" fallback="A PACSDA Initiative" />
            </a>
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
