
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

const countries = [
  "All Countries", "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", 
  "Burundi", "Cabo Verde", "Cameroon", "Central African Republic", "Chad", 
  "Comoros", "Congo", "Côte d'Ivoire", "DRC", "Djibouti", "Egypt", "Equatorial Guinea", 
  "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea", 
  "Guinea-Bissau", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", 
  "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", 
  "Namibia", "Niger", "Nigeria", "Rwanda", "São Tomé and Príncipe", "Senegal", 
  "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan", 
  "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe"
];

const themes = [
  "All Themes", "Population", "Education", "Health", "Employment", "Entrepreneurship"
];

const indicators = {
  "Population": ["Total Youth Population", "Youth as % of Total Population", "Growth Rate", "Urban/Rural Distribution", "Gender Distribution"],
  "Education": ["Literacy Rate", "Primary Enrollment", "Secondary Enrollment", "Tertiary Enrollment", "Completion Rates", "Gender Parity"],
  "Health": ["Access to Healthcare", "HIV Prevalence", "Mental Health", "Nutrition Status", "Healthcare Coverage"],
  "Employment": ["Unemployment Rate", "Labor Force Participation", "Formal vs Informal", "Industry Distribution", "Wage Levels"],
  "Entrepreneurship": ["Business Ownership Rate", "Startup Formation", "Access to Finance", "Innovation Metrics", "Business Survival Rate"]
};

const DataFilters = ({ 
  selectedCountry, 
  setSelectedCountry,
  selectedTheme,
  setSelectedTheme,
  selectedIndicator,
  setSelectedIndicator,
  yearRange,
  setYearRange
}: {
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  selectedTheme: string;
  setSelectedTheme: (theme: string) => void;
  selectedIndicator: string;
  setSelectedIndicator: (indicator: string) => void;
  yearRange: [number, number];
  setYearRange: (range: [number, number]) => void;
}) => {
  // Get indicators based on selected theme
  const availableIndicators = selectedTheme !== "All Themes" 
    ? indicators[selectedTheme as keyof typeof indicators] || []
    : ["Select a theme first"];

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-card">
      <div>
        <h3 className="text-lg font-semibold mb-4">Data Filters</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select 
              value={selectedCountry} 
              onValueChange={setSelectedCountry}
            >
              <SelectTrigger id="country">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select 
              value={selectedTheme} 
              onValueChange={(value) => {
                setSelectedTheme(value);
                setSelectedIndicator("Select an indicator");
              }}
            >
              <SelectTrigger id="theme">
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                {themes.map((theme) => (
                  <SelectItem key={theme} value={theme}>
                    {theme}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="indicator">Indicator</Label>
            <Select 
              value={selectedIndicator} 
              onValueChange={setSelectedIndicator}
              disabled={selectedTheme === "All Themes"}
            >
              <SelectTrigger id="indicator">
                <SelectValue placeholder="Select an indicator" />
              </SelectTrigger>
              <SelectContent>
                {availableIndicators.map((indicator) => (
                  <SelectItem key={indicator} value={indicator}>
                    {indicator}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex justify-between">
              <Label>Year Range</Label>
              <span className="text-sm text-muted-foreground">
                {yearRange[0]} - {yearRange[1]}
              </span>
            </div>
            <Slider
              defaultValue={[2010, 2023]}
              min={2000}
              max={2023}
              step={1}
              value={yearRange}
              onValueChange={(value) => setYearRange(value as [number, number])}
            />
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="gender">Gender</Label>
            <Select defaultValue="all">
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age Group</Label>
            <Select defaultValue="15-24">
              <SelectTrigger id="age">
                <SelectValue placeholder="Select age group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15-24">15-24 (Youth)</SelectItem>
                <SelectItem value="15-19">15-19</SelectItem>
                <SelectItem value="20-24">20-24</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataFilters;
