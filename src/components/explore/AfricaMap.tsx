
import React from 'react';

const AfricaMap = ({ onCountrySelect }: { onCountrySelect: (country: string) => void }) => {
  // This is a simplified version - in a real implementation, 
  // we would use a proper SVG map with country paths
  return (
    <div className="relative w-full h-full min-h-[400px] bg-pan-blue-50 rounded-lg border overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-muted-foreground">Interactive Africa map would be rendered here</p>
      </div>
      
      {/* Sample clickable areas - in real implementation, these would be SVG paths */}
      <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-pan-green-400/20 rounded-full cursor-pointer hover:bg-pan-green-400/40 transition-colors flex items-center justify-center text-xs font-medium"
           onClick={() => onCountrySelect('Kenya')}>
        Kenya
      </div>
      
      <div className="absolute top-1/4 left-1/3 w-16 h-16 bg-pan-orange-400/20 rounded-full cursor-pointer hover:bg-pan-orange-400/40 transition-colors flex items-center justify-center text-xs font-medium"
           onClick={() => onCountrySelect('Ethiopia')}>
        Ethiopia
      </div>
      
      <div className="absolute top-2/3 left-1/3 w-16 h-16 bg-pan-purple-400/20 rounded-full cursor-pointer hover:bg-pan-purple-400/40 transition-colors flex items-center justify-center text-xs font-medium"
           onClick={() => onCountrySelect('South Africa')}>
        South Africa
      </div>
      
      <div className="absolute top-1/3 left-1/2 w-16 h-16 bg-pan-blue-400/20 rounded-full cursor-pointer hover:bg-pan-blue-400/40 transition-colors flex items-center justify-center text-xs font-medium"
           onClick={() => onCountrySelect('Nigeria')}>
        Nigeria
      </div>
      
      <div className="absolute top-1/5 left-1/5 w-16 h-16 bg-pan-green-400/20 rounded-full cursor-pointer hover:bg-pan-green-400/40 transition-colors flex items-center justify-center text-xs font-medium"
           onClick={() => onCountrySelect('Egypt')}>
        Egypt
      </div>
    </div>
  );
};

export default AfricaMap;
