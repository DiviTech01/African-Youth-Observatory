
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CountryComparison from '@/components/compare/CountryComparison';

const Compare = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="bg-muted/30 py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-bold">Compare Countries</h1>
              <p className="text-muted-foreground">
                Compare youth statistics across multiple African countries.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <main className="flex-grow py-8">
        <CountryComparison />
      </main>
      
      <Footer />
    </div>
  );
};

export default Compare;
