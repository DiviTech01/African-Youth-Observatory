
import React, { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
// NLQ search bar removed from explore page
import DataFilters from '@/components/explore/DataFilters';
import DataChart from '@/components/explore/DataChart';
import AfricaMap from '@/components/explore/AfricaMap';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Content } from '@/components/cms';

const Explore = () => {
  const { t } = useLanguage();
  const [selectedCountry, setSelectedCountry] = useState("All Countries");
  const [selectedTheme, setSelectedTheme] = useState("All Themes");
  const [selectedIndicator, setSelectedIndicator] = useState("Select an indicator");
  const [yearRange, setYearRange] = useState<[number, number]>([2021, 2025]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const handleCountrySelect = useCallback((country: string) => {
    setSelectedCountry(country);
  }, []);
  
  const FilterContent = () => (
    <DataFilters 
      selectedCountry={selectedCountry}
      setSelectedCountry={setSelectedCountry}
      selectedTheme={selectedTheme}
      setSelectedTheme={setSelectedTheme}
      selectedIndicator={selectedIndicator}
      setSelectedIndicator={setSelectedIndicator}
      yearRange={yearRange}
      setYearRange={setYearRange}
    />
  );
  
  return (
    <>
      <div className="relative overflow-hidden pt-6 pb-3 md:pt-8 md:pb-4">
        <div className="absolute inset-0 opacity-30 w-full bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:6rem_5rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="container px-4 md:px-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent">{t('explore.title')}</h1>
              <p className="text-sm sm:text-base text-[#A89070]">
                {t('explore.subtitle')}
              </p>
            </div>
            
            {/* Mobile Filter Button */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden self-start gap-2">
                  <Filter className="h-4 w-4" />
                  <Content as="span" id="explore.filters_button" fallback="Filters" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[350px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <Content as="span" id="explore.filters_sheet_title" fallback="Data Filters" />
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      
      <div className="pt-2 md:pt-3 pb-6 md:pb-8">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Desktop Filters */}
            <div className="hidden lg:block lg:col-span-1">
              <FilterContent />
            </div>

            <div className="lg:col-span-3 space-y-6 md:space-y-8">
              <div className="rounded-2xl border border-gray-800 bg-white/[0.03] p-4 md:p-6">
                <div className="flex items-start justify-between mb-3 md:mb-4 gap-3">
                  <div>
                    <Content as="h3" id="explore.map.title" fallback="Africa Map" className="text-lg md:text-xl font-bold text-white" />
                    <Content
                      as="p"
                      id="explore.map.description"
                      fallback="Click on a country to view its youth data."
                      className="text-xs sm:text-sm text-gray-400 mt-1"
                    />
                  </div>
                  {selectedCountry !== 'All Countries' && (
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500">Selected</p>
                      <p className="text-sm font-semibold text-emerald-400">{selectedCountry}</p>
                    </div>
                  )}
                </div>
                <div className="h-[480px] sm:h-[560px] md:h-[640px] lg:h-[720px]">
                  <AfricaMap onCountrySelect={handleCountrySelect} selectedCountry={selectedCountry} />
                </div>
              </div>

              <DataChart
                country={selectedCountry}
                theme={selectedTheme}
                indicator={selectedIndicator}
                yearRange={yearRange}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Explore;
