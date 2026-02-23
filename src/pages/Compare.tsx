
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CountryComparison from '@/components/compare/CountryComparison';
import { BarChart3 } from 'lucide-react';

const Compare = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <header className="gradient-hero py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="section-title">Compare Countries</h1>
          </div>
          <p className="section-description max-w-2xl">
            Compare youth development indicators across multiple African countries. 
            Analyze trends, identify gaps, and discover insights.
          </p>
        </div>
      </header>
      
      <main className="flex-grow">
        <CountryComparison />
      </main>
      
      <Footer />
    </div>
  );
};

export default Compare;
