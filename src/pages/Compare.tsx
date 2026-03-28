
import React from 'react';
import CountryComparison from '@/components/compare/CountryComparison';

const Compare = () => {
  return (
    <>
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

      <div className="py-8">
        <CountryComparison />
      </div>
    </>
  );
};

export default Compare;
