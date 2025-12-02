
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft } from 'lucide-react';
import CountryProfile from '@/components/countries/CountryProfile';

const countries = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", 
  "Burundi", "Cabo Verde", "Cameroon", "Central African Republic", "Chad", 
  "Comoros", "Congo", "Côte d'Ivoire", "DRC", "Djibouti", "Egypt", "Equatorial Guinea", 
  "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea", 
  "Guinea-Bissau", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", 
  "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", 
  "Namibia", "Niger", "Nigeria", "Rwanda", "São Tomé and Príncipe", "Senegal", 
  "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan", 
  "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe"
];

const regionsMap: Record<string, string[]> = {
  "North Africa": ["Algeria", "Egypt", "Libya", "Morocco", "Tunisia"],
  "West Africa": ["Benin", "Burkina Faso", "Cabo Verde", "Côte d'Ivoire", "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Liberia", "Mali", "Mauritania", "Niger", "Nigeria", "Senegal", "Sierra Leone", "Togo"],
  "Central Africa": ["Cameroon", "Central African Republic", "Chad", "Congo", "DRC", "Equatorial Guinea", "Gabon", "São Tomé and Príncipe"],
  "East Africa": ["Burundi", "Comoros", "Djibouti", "Eritrea", "Ethiopia", "Kenya", "Madagascar", "Mauritius", "Rwanda", "Seychelles", "Somalia", "South Sudan", "Sudan", "Tanzania", "Uganda"],
  "Southern Africa": ["Angola", "Botswana", "Eswatini", "Lesotho", "Malawi", "Mozambique", "Namibia", "South Africa", "Zambia", "Zimbabwe"]
};

const Countries = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  
  const filteredCountries = countries.filter((country) => 
    country.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="bg-muted/30 py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col gap-3 md:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Country Profiles</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Explore detailed youth data profiles for African countries.
              </p>
            </div>
            
            <div className="flex w-full max-w-md mt-2 md:mt-4">
              <Input
                type="search"
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-r-none text-sm"
              />
              <Button className="rounded-l-none px-3 sm:px-4">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <main className="flex-grow py-6 md:py-8">
        {selectedCountry ? (
          <div className="container px-4 md:px-6">
            <Button
              variant="outline"
              onClick={() => setSelectedCountry(null)}
              className="mb-4 md:mb-6 gap-2 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Country List
            </Button>
            
            <CountryProfile country={selectedCountry} />
          </div>
        ) : (
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 md:gap-8">
              {Object.entries(regionsMap).map(([region, regionCountries]) => (
                <div key={region}>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 md:mb-4">{region}</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
                    {regionCountries
                      .filter(country => filteredCountries.includes(country))
                      .map((country) => (
                        <Button
                          key={country}
                          variant="outline"
                          onClick={() => setSelectedCountry(country)}
                          className="h-auto py-3 sm:py-4 md:py-6 justify-start flex-col items-start text-left"
                        >
                          <span className="text-sm sm:text-base md:text-lg font-medium line-clamp-1">{country}</span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                            Click to view
                          </span>
                        </Button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Countries;
