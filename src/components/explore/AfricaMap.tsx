
import React from 'react';

const AfricaMap = ({ onCountrySelect }: { onCountrySelect: (country: string) => void }) => {
  // This is a simplified version - in a real implementation, 
  // we would use a proper SVG map with country paths
  return (
    <div className="relative w-full h-full min-h-[400px] bg-black/40 rounded-xl border border-gray-800 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-gray-500">Interactive Africa map would be rendered here</p>
      </div>
      
      {/* Sample clickable areas - in real implementation, these would be SVG paths */}
      <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-green-500/20 rounded-full cursor-pointer hover:bg-green-500/30 transition-colors flex items-center justify-center text-xs font-medium text-gray-300"
           onClick={() => onCountrySelect('Kenya')}>
        Kenya
      </div>

      <div className="absolute top-1/4 left-1/3 w-16 h-16 bg-orange-500/20 rounded-full cursor-pointer hover:bg-orange-500/30 transition-colors flex items-center justify-center text-xs font-medium text-gray-300"
           onClick={() => onCountrySelect('Ethiopia')}>
        Ethiopia
      </div>

      <div className="absolute top-2/3 left-1/3 w-16 h-16 bg-purple-500/20 rounded-full cursor-pointer hover:bg-purple-500/30 transition-colors flex items-center justify-center text-xs font-medium text-gray-300"
           onClick={() => onCountrySelect('South Africa')}>
        South Africa
      </div>

      <div className="absolute top-1/3 left-1/2 w-16 h-16 bg-blue-500/20 rounded-full cursor-pointer hover:bg-blue-500/30 transition-colors flex items-center justify-center text-xs font-medium text-gray-300"
           onClick={() => onCountrySelect('Nigeria')}>
        Nigeria
      </div>

      <div className="absolute top-1/5 left-1/5 w-16 h-16 bg-green-500/20 rounded-full cursor-pointer hover:bg-green-500/30 transition-colors flex items-center justify-center text-xs font-medium text-gray-300"
           onClick={() => onCountrySelect('Egypt')}>
        Egypt
      </div>
    </div>
  );
};

export default AfricaMap;
