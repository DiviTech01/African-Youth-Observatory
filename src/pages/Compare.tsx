
import React from 'react';
import CountryComparison from '@/components/compare/CountryComparison';

const Compare = () => {
  return (
    <>
      <div className="relative pt-6 pb-3 md:pt-8 md:pb-4 overflow-hidden">
        <div className="absolute inset-0 opacity-30 w-full bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:6rem_5rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="relative z-10 container px-4 md:px-6">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent">Compare Countries</h1>
          <p className="text-sm text-[#A89070] mt-1">
            Compare youth statistics across multiple African countries.
          </p>
        </div>
      </div>

      <CountryComparison />
    </>
  );
};

export default Compare;
