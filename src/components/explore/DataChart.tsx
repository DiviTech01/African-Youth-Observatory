
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share, ExternalLink } from 'lucide-react';

const DataChart = ({ 
  country, 
  theme,
  indicator,
  yearRange
}: {
  country: string;
  theme: string;
  indicator: string;
  yearRange: [number, number];
}) => {
  return (
    <div className="border rounded-lg p-6 bg-card">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold">{indicator}</h3>
          <p className="text-sm text-muted-foreground">
            {country !== "All Countries" ? country : "All African Countries"}, {yearRange[0]}-{yearRange[1]}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Share className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Embed</span>
          </Button>
        </div>
      </div>
      
      <div className="chart-container border border-dashed rounded-md bg-background p-4 flex items-center justify-center">
        {(theme === "All Themes" || indicator === "Select an indicator") ? (
          <p className="text-muted-foreground">Select a theme and indicator to display chart data</p>
        ) : (
          <div className="w-full h-full">
            {/* This is where we would render an actual chart with Recharts */}
            <div className="w-full h-full flex items-end justify-around px-10">
              {[...Array(10)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-6 bg-pan-green-500 hover:bg-pan-green-600 transition-all rounded-t-md relative group"
                  style={{ height: `${20 + Math.random() * 60}%` }}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 transform -translate-x-1/2 bg-foreground text-background text-xs py-1 px-2 rounded transition-opacity">
                    {yearRange[0] + i}: {Math.floor(Math.random() * 100)}%
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between px-8">
              <span className="text-xs text-muted-foreground">{yearRange[0]}</span>
              <span className="text-xs text-muted-foreground">{yearRange[1]}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-6 p-4 bg-muted rounded-md">
        <h4 className="font-medium mb-2">Data Notes</h4>
        <p className="text-sm text-muted-foreground">
          {theme !== "All Themes" && indicator !== "Select an indicator" 
            ? `This data displays ${indicator.toLowerCase()} for ${country !== "All Countries" ? country : "all African countries"} from ${yearRange[0]} to ${yearRange[1]}. Source: Ministry of Youth and Sports, UNDP Africa.`
            : "Select data filters to see information about the data source and methodology."}
        </p>
      </div>
    </div>
  );
};

export default DataChart;
