import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const MinimalHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md bg-primary">
            <span className="font-bold text-primary-foreground text-sm sm:text-base">AYO</span>
          </div>
          <span className="hidden font-display font-bold sm:inline-block text-sm md:text-base text-foreground">
            African Youth Observatory
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-xs sm:text-sm h-8 sm:h-9 px-3" asChild>
            <Link to="/auth/signin">Sign In</Link>
          </Button>
          <Button size="sm" className="text-xs sm:text-sm h-8 sm:h-9 px-3" asChild>
            <Link to="/auth/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default MinimalHeader;
