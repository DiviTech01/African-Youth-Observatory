
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const YEAR_RANGES: { label: string; range: [number, number] }[] = [
  { label: '2000-2005', range: [2000, 2005] },
  { label: '2006-2010', range: [2006, 2010] },
  { label: '2011-2015', range: [2011, 2015] },
  { label: '2016-2020', range: [2016, 2020] },
  { label: '2021-2025', range: [2021, 2025] },
  { label: 'All Years', range: [2000, 2025] },
];

const AGE_GROUPS = ['15-20', '21-25', '26-30', '31-35', 'All Ages'];

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

  const [ageGroup, setAgeGroup] = useState<string>('15-20');

  const isYearRangeActive = (r: [number, number]) =>
    yearRange[0] === r[0] && yearRange[1] === r[1];

  return (
    <div className="space-y-6 p-4 rounded-2xl border border-gray-800 bg-white/[0.03]">
      <div>
        <h3 className="text-lg font-semibold mb-4 bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent">Data Filters</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="country" className="text-gray-300">Country</Label>
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
            <Label htmlFor="theme" className="text-gray-300">Theme</Label>
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
            <Label htmlFor="indicator" className="text-gray-300">Indicator</Label>
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

          <div className="space-y-2 pt-2">
            <Label className="text-gray-300">Year Range</Label>
            <div className="grid grid-cols-2 gap-2">
              {YEAR_RANGES.map((opt) => (
                <Button
                  key={opt.label}
                  type="button"
                  size="sm"
                  variant={isYearRangeActive(opt.range) ? 'default' : 'outline'}
                  onClick={() => setYearRange(opt.range)}
                  className="text-xs"
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="gender" className="text-gray-300">Gender</Label>
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
            <Label className="text-gray-300">Age Group</Label>
            <div className="grid grid-cols-2 gap-2">
              {AGE_GROUPS.map((g) => (
                <Button
                  key={g}
                  type="button"
                  size="sm"
                  variant={ageGroup === g ? 'default' : 'outline'}
                  onClick={() => setAgeGroup(g)}
                  className="text-xs"
                >
                  {g}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataFilters;
