import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, TrendingUp, Globe, Database } from 'lucide-react';

const Hero = () => {
  return (
    <section className="py-10 sm:py-16 md:py-24 gradient-hero">
      <div className="container px-4 md:px-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="flex flex-col justify-center space-y-6 text-center lg:text-left">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                Africa's Youth Data Intelligence Platform
              </div>
              <h1 className="text-3xl font-display font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                African Youth Observatory
              </h1>
              <p className="max-w-[600px] text-muted-foreground text-base sm:text-lg md:text-xl mx-auto lg:mx-0">
                Powering policy, research, innovation, and investment decisions with trusted, 
                accessible youth data across all 54 African countries.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md mx-auto lg:mx-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search countries, indicators, themes..."
                className="pl-10 pr-4 py-6 text-base rounded-full border-2 focus:border-primary"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link to="/explore">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  <Database className="h-4 w-4" />
                  Explore Data
                </Button>
              </Link>
              <Link to="/youth-index">
                <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Youth Index
                </Button>
              </Link>
              <Link to="/compare">
                <Button variant="ghost" size="lg" className="w-full sm:w-auto gap-2">
                  Compare Countries
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 max-w-md mx-auto lg:mx-0">
              <div className="text-center lg:text-left">
                <p className="text-2xl sm:text-3xl font-bold text-primary">54</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Countries</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="text-2xl sm:text-3xl font-bold text-primary">500+</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Indicators</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="text-2xl sm:text-3xl font-bold text-primary">226M</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Youth Covered</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center order-first lg:order-last">
            <div className="relative w-full max-w-[300px] sm:max-w-[400px] md:max-w-[450px] aspect-square">
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse-gentle"></div>
              <div className="absolute inset-4 rounded-full bg-primary/5 flex items-center justify-center">
                <Globe className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 text-primary/60" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
