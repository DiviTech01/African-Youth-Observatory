// ============================================
// AFRICAN YOUTH DATABASE - INTERACTIVE MAP
// Professional geographic map with react-simple-maps
// ============================================

import React, { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMapData, useYouthIndexRankings } from '@/hooks/useData';
import { AFRICAN_COUNTRIES, getCountryById, INDICATORS } from '@/types';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface AfricaMapProps {
  onCountrySelect: (country: string) => void;
}

// Africa TopoJSON URL (Natural Earth data)
const AFRICA_TOPO_JSON = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Map ISO3 codes to our country IDs
const ISO3_TO_ID: Record<string, string> = {
  'DZA': 'dz', 'AGO': 'ao', 'BEN': 'bj', 'BWA': 'bw', 'BFA': 'bf', 'BDI': 'bi',
  'CMR': 'cm', 'CPV': 'cv', 'CAF': 'cf', 'TCD': 'td', 'COM': 'km', 'COG': 'cg',
  'COD': 'cd', 'CIV': 'ci', 'DJI': 'dj', 'EGY': 'eg', 'GNQ': 'gq', 'ERI': 'er',
  'SWZ': 'sz', 'ETH': 'et', 'GAB': 'ga', 'GMB': 'gm', 'GHA': 'gh', 'GIN': 'gn',
  'GNB': 'gw', 'KEN': 'ke', 'LSO': 'ls', 'LBR': 'lr', 'LBY': 'ly', 'MDG': 'mg',
  'MWI': 'mw', 'MLI': 'ml', 'MRT': 'mr', 'MUS': 'mu', 'MAR': 'ma', 'MOZ': 'mz',
  'NAM': 'na', 'NER': 'ne', 'NGA': 'ng', 'RWA': 'rw', 'STP': 'st', 'SEN': 'sn',
  'SYC': 'sc', 'SLE': 'sl', 'SOM': 'so', 'ZAF': 'za', 'SSD': 'ss', 'SDN': 'sd',
  'TZA': 'tz', 'TGO': 'tg', 'TUN': 'tn', 'UGA': 'ug', 'ZMB': 'zm', 'ZWE': 'zw'
};

const AfricaMap: React.FC<AfricaMapProps> = ({ onCountrySelect }) => {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedIndicator, setSelectedIndicator] = useState('edu001'); // Youth Literacy
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = useState<any>(null);
  const [zoom, setZoom] = useState(1);

  // Fetch map data
  const { data: mapData, isLoading } = useMapData(selectedIndicator, selectedYear);
  const { data: youthIndexData } = useYouthIndexRankings(selectedYear);

  // Get color based on value with enhanced scale
  const getCountryColor = (countryId: string): string => {
    const dataPoint = mapData?.find(d => d.countryId === countryId);
    if (!dataPoint) return '#F3F4F6'; // gray-100

    const value = dataPoint.value;
    // Enhanced color scale from red (low) to yellow (medium) to green (high)
    if (value >= 85) return '#10B981'; // emerald-500
    if (value >= 75) return '#22C55E'; // green-500
    if (value >= 65) return '#84CC16'; // lime-500
    if (value >= 55) return '#EAB308'; // yellow-500
    if (value >= 45) return '#F59E0B'; // amber-500
    if (value >= 35) return '#F97316'; // orange-500
    if (value >= 25) return '#EF4444'; // red-500
    return '#DC2626'; // red-600
  };

  const getCountryData = (countryId: string) => {
    const country = getCountryById(countryId);
    const dataPoint = mapData?.find(d => d.countryId === countryId);
    const indexData = youthIndexData?.find(yi => yi.countryId === countryId);

    return {
      country,
      value: dataPoint?.value,
      formattedValue: dataPoint?.formattedValue,
      rank: indexData?.rank,
      indexScore: indexData?.indexScore,
    };
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.5, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.5, 1));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-full sm:w-64">
          <label className="text-xs font-medium mb-2 block">Select Indicator</label>
          <Select value={selectedIndicator} onValueChange={setSelectedIndicator}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="edu001">Youth Literacy Rate</SelectItem>
              <SelectItem value="edu002">Secondary Enrollment</SelectItem>
              <SelectItem value="emp001">Youth Unemployment</SelectItem>
              <SelectItem value="inn001">Internet Penetration</SelectItem>
              <SelectItem value="hlt004">Healthcare Access</SelectItem>
              <SelectItem value="fin001">Bank Account Ownership</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:flex-1 sm:max-w-md">
          <label className="text-xs font-medium mb-2 block">Year: {selectedYear}</label>
          <Slider
            value={[selectedYear]}
            onValueChange={(v) => setSelectedYear(v[0])}
            min={2010}
            max={2024}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Map Container */}
      <div className="relative">
        <Card className="overflow-hidden">
          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <Button size="icon" variant="secondary" onClick={handleZoomIn} className="h-8 w-8">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="secondary" onClick={handleZoomOut} className="h-8 w-8">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="secondary" onClick={handleResetZoom} className="h-8 w-8">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Legend */}
          <div className="absolute top-4 left-4 z-10 bg-background/95 backdrop-blur-sm p-3 rounded-lg border shadow-lg">
            <p className="text-xs font-semibold mb-2">Value Scale</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-3 rounded" style={{ backgroundColor: '#10B981' }} />
                <span className="text-[10px]">85-100</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-3 rounded" style={{ backgroundColor: '#84CC16' }} />
                <span className="text-[10px]">65-85</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-3 rounded" style={{ backgroundColor: '#EAB308' }} />
                <span className="text-[10px]">55-65</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-3 rounded" style={{ backgroundColor: '#F97316' }} />
                <span className="text-[10px]">35-55</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-3 rounded" style={{ backgroundColor: '#EF4444' }} />
                <span className="text-[10px]">0-35</span>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="relative bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20" style={{ height: '600px' }}>
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                center: [20, 0],
                scale: 400,
              }}
              style={{ width: '100%', height: '100%' }}
            >
              <ZoomableGroup zoom={zoom} center={[20, 0]}>
                <Geographies geography={AFRICA_TOPO_JSON}>
                  {({ geographies }) =>
                    geographies
                      .filter((geo) => {
                        // Filter to only African countries
                        const iso3 = geo.properties.ISO_A3 || geo.id;
                        return ISO3_TO_ID[iso3];
                      })
                      .map((geo) => {
                        const iso3 = geo.properties.ISO_A3 || geo.id;
                        const countryId = ISO3_TO_ID[iso3];
                        const country = countryId ? getCountryById(countryId) : null;
                        const fillColor = countryId ? getCountryColor(countryId) : '#F3F4F6';
                        const isHovered = hoveredCountry === countryId;

                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={fillColor}
                            stroke="#fff"
                            strokeWidth={isHovered ? 2 : 0.5}
                            style={{
                              default: { outline: 'none' },
                              hover: {
                                fill: fillColor,
                                opacity: 0.9,
                                outline: 'none',
                                cursor: 'pointer',
                                filter: 'brightness(1.1)',
                              },
                              pressed: { outline: 'none' },
                            }}
                            onMouseEnter={() => {
                              if (countryId) {
                                setHoveredCountry(countryId);
                                setTooltipContent(getCountryData(countryId));
                              }
                            }}
                            onMouseLeave={() => {
                              setHoveredCountry(null);
                              setTooltipContent(null);
                            }}
                            onClick={() => {
                              if (country) {
                                onCountrySelect(country.name);
                              }
                            }}
                          />
                        );
                      })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>

            {/* Tooltip */}
            {tooltipContent && tooltipContent.country && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
                <Card className="p-3 shadow-xl min-w-[220px] border-2 bg-background/98 backdrop-blur-sm">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-bold text-sm flex items-center gap-1">
                        <span className="text-xl">{tooltipContent.country.flagEmoji}</span>
                        {tooltipContent.country.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{tooltipContent.country.region}</p>
                    </div>
                    {tooltipContent.rank && (
                      <Badge variant="secondary" className="text-[10px] font-bold">
                        #{tooltipContent.rank}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Value:</span>
                      <span className="font-semibold">{tooltipContent.formattedValue || 'N/A'}</span>
                    </div>
                    {tooltipContent.indexScore && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Youth Index:</span>
                        <span className="font-semibold">{tooltipContent.indexScore.toFixed(1)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[10px] pt-1 border-t">
                      <span className="text-muted-foreground">Population:</span>
                      <span className="font-medium">
                        {(tooltipContent.country.population / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground pt-1 border-t text-center">
                      Click to view full profile →
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Countries</p>
          <p className="text-2xl font-bold">54</p>
          <p className="text-[10px] text-muted-foreground mt-1">African nations</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Year</p>
          <p className="text-2xl font-bold">{selectedYear}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Historical data</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Highest</p>
          <p className="text-2xl font-bold text-green-600">
            {mapData && mapData.length > 0 ? Math.max(...mapData.map(d => d.value)).toFixed(1) : '-'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {mapData && mapData.length > 0 
              ? getCountryById(mapData.reduce((max, d) => d.value > max.value ? d : max).countryId)?.name 
              : 'Loading...'}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Average</p>
          <p className="text-2xl font-bold text-blue-600">
            {mapData && mapData.length > 0 
              ? (mapData.reduce((sum, d) => sum + d.value, 0) / mapData.length).toFixed(1) 
              : '-'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Continental avg</p>
        </Card>
      </div>
    </div>
  );
};

export default AfricaMap;
