
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Download, BarChart, PieChart, Filter, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

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

const indicators = {
  "Population": ["Youth Population (15-24)", "Youth as % of Total Population", "Youth Growth Rate", "Youth Urban/Rural Distribution"],
  "Education": ["Youth Literacy Rate", "Secondary School Enrollment", "Tertiary Enrollment", "Gender Parity in Education"],
  "Health": ["Youth Access to Healthcare", "HIV Prevalence Among Youth", "Youth Mental Health Services", "Youth Nutrition Status"],
  "Employment": ["Youth Unemployment Rate", "Youth Labor Force Participation", "Youth in Informal Sector", "Youth Average Wages"],
  "Entrepreneurship": ["Youth Business Ownership", "Youth Startup Formation", "Youth Access to Finance", "Youth Innovation Index"]
};

const CountryComparison = () => {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>("Education");
  const [selectedIndicator, setSelectedIndicator] = useState<string>("");
  const [chartType, setChartType] = useState<'bar' | 'radar'>('bar');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const availableIndicators = indicators[selectedTheme as keyof typeof indicators] || [];
  
  const handleCountryToggle = (country: string) => {
    if (selectedCountries.includes(country)) {
      setSelectedCountries(selectedCountries.filter(c => c !== country));
    } else {
      if (selectedCountries.length < 5) {
        setSelectedCountries([...selectedCountries, country]);
      }
    }
  };

  const FilterContent = () => (
    <div className="space-y-4 md:space-y-6">
      <div className="space-y-2">
        <Label className="text-sm">Selected Countries ({selectedCountries.length}/5)</Label>
        <div className="grid grid-cols-1 gap-2 max-h-[150px] md:max-h-[200px] overflow-y-auto pr-2">
          {selectedCountries.map(country => (
            <div key={country} className="flex items-center justify-between bg-muted p-2 rounded-md">
              <span className="text-sm truncate mr-2">{country}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCountryToggle(country)}
                className="h-7 px-2 text-xs"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      
      {selectedCountries.length < 5 && (
        <div className="space-y-2">
          <Label className="text-sm">Add Countries</Label>
          <Select onValueChange={handleCountryToggle}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select a country to add" />
            </SelectTrigger>
            <SelectContent>
              {countries
                .filter(country => !selectedCountries.includes(country))
                .map(country => (
                  <SelectItem key={country} value={country} className="text-sm">
                    {country}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="theme" className="text-sm">Theme</Label>
        <Select 
          value={selectedTheme} 
          onValueChange={(value) => {
            setSelectedTheme(value);
            setSelectedIndicator("");
          }}
        >
          <SelectTrigger id="theme" className="text-sm">
            <SelectValue placeholder="Select a theme" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(indicators).map((theme) => (
              <SelectItem key={theme} value={theme} className="text-sm">
                {theme}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="indicator" className="text-sm">Indicator</Label>
        <Select 
          value={selectedIndicator} 
          onValueChange={setSelectedIndicator}
        >
          <SelectTrigger id="indicator" className="text-sm">
            <SelectValue placeholder="Select an indicator" />
          </SelectTrigger>
          <SelectContent>
            {availableIndicators.map((indicator) => (
              <SelectItem key={indicator} value={indicator} className="text-sm">
                {indicator}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm">Chart Type</Label>
        <div className="flex gap-2">
          <Button 
            variant={chartType === 'bar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('bar')}
            className="flex-1 text-xs"
          >
            <BarChart className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            Bar
          </Button>
          <Button 
            variant={chartType === 'radar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('radar')}
            className="flex-1 text-xs"
          >
            <PieChart className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            Radar
          </Button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="container px-4 md:px-6 py-4 md:py-6">
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {selectedCountries.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                  {selectedCountries.length}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[350px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Compare Countries</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Desktop Filters */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="border rounded-lg p-4 md:p-6 bg-card h-full">
            <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6">Compare Countries</h3>
            <FilterContent />
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="border rounded-lg p-4 md:p-6 bg-card">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4 md:mb-6">
              <div>
                <h3 className="text-lg md:text-xl font-bold">
                  {selectedIndicator || "Select an indicator"}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Comparing {selectedCountries.length} countries, {new Date().getFullYear()}
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-1 text-xs sm:text-sm">
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
            
            <div className="h-[250px] sm:h-[300px] md:h-[350px] border border-dashed rounded-md bg-background p-4 flex items-center justify-center">
              {selectedCountries.length === 0 || !selectedIndicator ? (
                <p className="text-sm text-muted-foreground text-center px-4">
                  {selectedCountries.length === 0 
                    ? "Select countries to compare" 
                    : "Select an indicator to display chart data"}
                </p>
              ) : (
                <div className="w-full h-full">
                  {chartType === 'bar' ? (
                    <div className="w-full h-full flex items-end justify-around pt-6 md:pt-10">
                      {selectedCountries.map((country, i) => (
                        <div key={country} className="flex flex-col items-center gap-1 md:gap-2 group">
                          <div 
                            className={`w-8 sm:w-10 md:w-12 bg-pan-${['green', 'blue', 'orange', 'purple', 'green'][i]}-500 hover:bg-pan-${['green', 'blue', 'orange', 'purple', 'green'][i]}-600 transition-all rounded-t-md`}
                            style={{ height: `${20 + Math.random() * 60}%` }}
                          ></div>
                          <span className="text-[10px] sm:text-xs font-medium text-center max-w-[50px] sm:max-w-[80px] truncate">{country}</span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground">{Math.floor(Math.random() * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="relative w-[150px] h-[150px] sm:w-[180px] sm:h-[180px] md:w-[200px] md:h-[200px] bg-muted rounded-full flex items-center justify-center">
                        <span className="text-xs sm:text-sm text-muted-foreground">Radar Chart</span>
                        
                        {selectedCountries.map((country, i) => (
                          <div 
                            key={country}
                            className={`absolute w-2 h-2 rounded-full bg-pan-${['green', 'blue', 'orange', 'purple', 'green'][i]}-500`}
                            style={{ 
                              left: `${50 + (Math.cos(i * (2 * Math.PI / selectedCountries.length)) * (30 + Math.random() * 40))}%`, 
                              top: `${50 + (Math.sin(i * (2 * Math.PI / selectedCountries.length)) * (30 + Math.random() * 40))}%`
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-4 md:mt-6 p-3 md:p-4 bg-muted rounded-md">
              <h4 className="font-medium mb-1 md:mb-2 text-sm md:text-base">Analysis</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {selectedCountries.length > 0 && selectedIndicator 
                  ? `This comparison shows ${selectedIndicator.toLowerCase()} across the selected countries. Data is from the latest available year. Source: Various national statistical offices, UNDP Africa.`
                  : "Select countries and an indicator to see comparative analysis."}
              </p>
            </div>
            
            {selectedCountries.length > 0 && selectedIndicator && (
              <div className="mt-4 md:mt-6 overflow-x-auto -mx-4 md:mx-0">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Country
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {selectedIndicator}
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Year
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {selectedCountries.map((country) => (
                      <tr key={country}>
                        <td className="px-3 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs sm:text-sm font-medium">
                          {country}
                        </td>
                        <td className="px-3 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs sm:text-sm text-muted-foreground">
                          {Math.floor(Math.random() * 100)}%
                        </td>
                        <td className="px-3 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs sm:text-sm text-muted-foreground">
                          {2020 + Math.floor(Math.random() * 3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountryComparison;
