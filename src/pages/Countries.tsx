
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
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
      <div className="bg-muted/30 py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-bold">Country Profiles</h1>
              <p className="text-muted-foreground">
                Explore detailed youth data profiles for African countries.
              </p>
            </div>
            
            <div className="flex max-w-md mt-4">
              <Input
                type="search"
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-r-none"
              />
              <Button className="rounded-l-none">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <main className="flex-grow py-8">
        {selectedCountry ? (
          <div className="container px-4 md:px-6">
            <Button
              variant="outline"
              onClick={() => setSelectedCountry(null)}
              className="mb-6"
            >
              Back to Country List
            </Button>
            
            <CountryProfile country={selectedCountry} />
          </div>
        ) : (
          <div className="container px-4 md:px-6">
            <div className="grid gap-8">
              {Object.entries(regionsMap).map(([region, regionCountries]) => (
                <div key={region}>
                  <h2 className="text-2xl font-bold mb-4">{region}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {regionCountries
                      .filter(country => filteredCountries.includes(country))
                      .map((country) => (
                        <Button
                          key={country}
                          variant="outline"
                          onClick={() => setSelectedCountry(country)}
                          className="h-auto py-6 justify-start flex-col items-start text-left"
                        >
                          <span className="text-lg font-medium">{country}</span>
                          <span className="text-xs text-muted-foreground mt-1">
                            Click to view profile
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
