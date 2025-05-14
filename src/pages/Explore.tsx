
import React, { useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DataFilters from '@/components/explore/DataFilters';
import DataChart from '@/components/explore/DataChart';
import AfricaMap from '@/components/explore/AfricaMap';

const Explore = () => {
  const [selectedCountry, setSelectedCountry] = useState("All Countries");
  const [selectedTheme, setSelectedTheme] = useState("All Themes");
  const [selectedIndicator, setSelectedIndicator] = useState("Select an indicator");
  const [yearRange, setYearRange] = useState<[number, number]>([2010, 2023]);
  
  const handleCountrySelect = useCallback((country: string) => {
    setSelectedCountry(country);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="bg-muted/30 py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-bold">Data Explorer</h1>
              <p className="text-muted-foreground">
                Explore comprehensive data on African youth across multiple countries and themes.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <main className="flex-grow py-8">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
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
            </div>
            
            <div className="lg:col-span-3 space-y-8">
              <div className="border rounded-lg p-6 bg-card">
                <h3 className="text-xl font-bold mb-4">Africa Map</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click on a country to view its youth data.
                </p>
                <div className="h-[400px]">
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
      </main>
      
      <Footer />
    </div>
  );
};

export default Explore;
