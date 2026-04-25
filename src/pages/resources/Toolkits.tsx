import React from 'react';
import { Wrench } from 'lucide-react';

const Toolkits = () => {
  return (
    <>
      <header className="relative py-8 md:py-12 overflow-hidden">
        <div className="absolute inset-0 opacity-30 w-full bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:6rem_5rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="h-7 w-7 text-[#D4A017]" />
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent">
              Toolkits
            </h1>
          </div>
          <p className="text-sm sm:text-base text-[#A89070]">
            Practical guides and resources for working with African youth data.
          </p>
        </div>
      </header>

      <div className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center rounded-2xl border border-gray-800 bg-white/[0.03] p-8 md:p-12">
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-3">Content coming soon</h2>
            <p className="text-sm md:text-base text-gray-400 leading-relaxed">
              We're putting together toolkits for researchers, policymakers, and journalists working with
              African youth data — including data dictionaries, methodology cheatsheets, and citation
              templates. Check back shortly.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Toolkits;
