
import React, { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import NLQSearchBar from '@/components/NLQSearchBar';
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

const Explore = () => {
  const { t } = useLanguage();
  const [selectedCountry, setSelectedCountry] = useState("All Countries");
  const [selectedTheme, setSelectedTheme] = useState("All Themes");
  const [selectedIndicator, setSelectedIndicator] = useState("Select an indicator");
  const [yearRange, setYearRange] = useState<[number, number]>([2010, 2023]);
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
      <div className="bg-muted/30 py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{t('explore.title')}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {t('explore.subtitle')}
              </p>
            </div>
            
            {/* Mobile Filter Button */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden self-start gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[350px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Data Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      
      <div className="py-6 md:py-8">
        <div className="container px-4 md:px-6">
          <div className="mb-6">
            <NLQSearchBar />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Desktop Filters */}
            <div className="hidden lg:block lg:col-span-1">
              <FilterContent />
            </div>

            <div className="lg:col-span-3 space-y-6 md:space-y-8">
              <div className="border rounded-lg p-4 md:p-6 bg-card">
                <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Africa Map</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                  Click on a country to view its youth data.
                </p>
                <div className="h-[300px] sm:h-[350px] md:h-[400px]">
                  <AfricaMap onCountrySelect={handleCountrySelect} />
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
