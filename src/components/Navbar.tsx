
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, Menu, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleSearch = () => setIsSearchOpen(!isSearchOpen);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-pan-green-500">
              <span className="font-bold text-white">AY</span>
            </div>
            <span className="hidden font-bold sm:inline-block">
              African Youth Stats
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
            Home
          </Link>
          <Link to="/explore" className="text-sm font-medium hover:text-primary transition-colors">
            Data Explorer
          </Link>
          <Link to="/compare" className="text-sm font-medium hover:text-primary transition-colors">
            Compare Countries
          </Link>
          <Link to="/themes" className="text-sm font-medium hover:text-primary transition-colors">
            Themes
          </Link>
          <Link to="/countries" className="text-sm font-medium hover:text-primary transition-colors">
            Countries
          </Link>
          <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors">
            About
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {isSearchOpen ? (
            <div className="flex items-center relative animate-fade-in">
              <Input
                type="search"
                placeholder="Search countries, themes..."
                className="w-[200px] lg:w-[300px]"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSearch}
                className="absolute right-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSearch}
              className="hidden sm:flex"
            >
              <Search className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex"
          >
            Sign In
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMenu}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-16 z-50 bg-background md:hidden animate-fade-in">
          <div className="container py-6 flex flex-col gap-6">
            <div className="flex flex-col space-y-3">
              <Link 
                to="/" 
                className="flex items-center gap-2 text-lg font-medium"
                onClick={toggleMenu}
              >
                Home
              </Link>
              <Link 
                to="/explore" 
                className="flex items-center gap-2 text-lg font-medium"
                onClick={toggleMenu}
              >
                Data Explorer
              </Link>
              <Link 
                to="/compare" 
                className="flex items-center gap-2 text-lg font-medium"
                onClick={toggleMenu}
              >
                Compare Countries
              </Link>
              <Link 
                to="/themes" 
                className="flex items-center gap-2 text-lg font-medium"
                onClick={toggleMenu}
              >
                Themes
              </Link>
              <Link 
                to="/countries" 
                className="flex items-center gap-2 text-lg font-medium"
                onClick={toggleMenu}
              >
                Countries
              </Link>
              <Link 
                to="/about" 
                className="flex items-center gap-2 text-lg font-medium"
                onClick={toggleMenu}
              >
                About
              </Link>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex items-center my-4">
                <Input
                  type="search"
                  placeholder="Search countries, themes..."
                  className="w-full"
                />
              </div>
              <Button className="w-full" variant="outline">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
