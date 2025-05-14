
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-muted py-12 mt-16">
      <div className="container grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-pan-green-500">
              <span className="font-bold text-white">AY</span>
            </div>
            <span className="font-bold">
              African Youth Stats
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            The central hub for African youth statistics, supporting research, policy-making, and development initiatives.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter w-5 h-5"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin w-5 h-5"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook w-5 h-5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-4">Navigation</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
            <li><Link to="/explore" className="hover:text-foreground transition-colors">Data Explorer</Link></li>
            <li><Link to="/compare" className="hover:text-foreground transition-colors">Compare Countries</Link></li>
            <li><Link to="/themes" className="hover:text-foreground transition-colors">Themes</Link></li>
            <li><Link to="/countries" className="hover:text-foreground transition-colors">Countries</Link></li>
            <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-medium mb-4">Resources</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/resources/glossary" className="hover:text-foreground transition-colors">Glossary</Link></li>
            <li><Link to="/resources/methodology" className="hover:text-foreground transition-colors">Methodology</Link></li>
            <li><Link to="/resources/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
            <li><Link to="/resources/reports" className="hover:text-foreground transition-colors">Reports</Link></li>
            <li><Link to="/resources/toolkits" className="hover:text-foreground transition-colors">Toolkits</Link></li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-medium mb-4">Contact</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="mailto:info@africanyouthstats.org" className="hover:text-foreground transition-colors">
                info@africanyouthstats.org
              </a>
            </li>
            <li>
              <Link to="/contact" className="hover:text-foreground transition-colors">
                Contact Form
              </Link>
            </li>
          </ul>
          
          <h3 className="font-medium mt-6 mb-4">Newsletter</h3>
          <form className="flex flex-col gap-2">
            <input
              type="email"
              placeholder="Your email"
              className="px-3 py-2 bg-background border rounded-md text-sm"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-pan-green-500 text-white rounded-md text-sm font-medium hover:bg-pan-green-600 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
      
      <div className="container mt-12 pt-6 border-t border-muted-foreground/20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2025 African Youth Statistics Database. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
