import React, { useState, useMemo } from 'react';

interface AfricaMapProps {
  onCountrySelect: (country: string) => void;
  selectedCountry?: string;
}

/* --------------------------------------------------------
 * Simplified SVG paths for African countries.
 * Each path is a rough approximation scaled to a 1000x1000 viewBox.
 * -------------------------------------------------------- */
const COUNTRIES: { name: string; d: string }[] = [
  // North Africa
  { name: "Morocco", d: "M330,120 L360,105 L395,108 L410,120 L405,140 L390,160 L370,165 L340,155 L325,140 Z" },
  { name: "Algeria", d: "M395,108 L410,95 L440,90 L480,100 L510,110 L520,140 L515,180 L500,220 L480,250 L450,260 L420,240 L400,210 L390,180 L390,160 L405,140 L410,120 Z" },
  { name: "Tunisia", d: "M440,85 L455,80 L460,95 L455,110 L440,112 L435,100 Z" },
  { name: "Libya", d: "M460,95 L480,88 L520,85 L560,92 L575,110 L580,140 L575,170 L560,195 L540,210 L520,215 L510,200 L515,180 L520,140 L510,110 L480,100 L460,100 Z" },
  { name: "Egypt", d: "M575,110 L600,100 L625,105 L635,120 L640,145 L630,170 L615,185 L600,190 L585,180 L575,170 L580,140 Z" },
  // West Africa
  { name: "Mauritania", d: "M290,195 L325,180 L360,185 L380,200 L385,230 L370,260 L340,275 L310,270 L285,250 L280,225 Z" },
  { name: "Mali", d: "M360,185 L400,210 L420,240 L430,270 L415,300 L390,310 L365,305 L345,290 L340,275 L370,260 L385,230 L380,200 Z" },
  { name: "Niger", d: "M420,240 L450,260 L480,265 L510,260 L530,275 L520,300 L500,315 L475,320 L450,315 L430,305 L415,300 L430,270 Z" },
  { name: "Chad", d: "M530,275 L555,260 L575,270 L585,300 L580,330 L565,350 L540,355 L520,340 L510,320 L500,315 L520,300 Z" },
  { name: "Senegal", d: "M260,310 L285,300 L305,305 L310,315 L295,325 L275,325 L260,320 Z" },
  { name: "Gambia", d: "M265,318 L290,316 L295,322 L270,322 Z" },
  { name: "Guinea-Bissau", d: "M258,330 L275,325 L280,338 L265,340 Z" },
  { name: "Guinea", d: "M270,335 L295,325 L315,330 L325,345 L310,360 L285,355 L270,345 Z" },
  { name: "Sierra Leone", d: "M270,355 L285,355 L290,370 L275,375 L265,365 Z" },
  { name: "Liberia", d: "M280,370 L295,365 L310,375 L305,390 L290,390 L275,380 Z" },
  { name: "Côte d'Ivoire", d: "M310,360 L335,345 L360,345 L370,360 L365,380 L350,395 L330,395 L310,385 L305,375 Z" },
  { name: "Burkina Faso", d: "M335,300 L365,305 L380,315 L375,335 L360,345 L335,345 L320,335 L315,320 Z" },
  { name: "Ghana", d: "M370,360 L380,340 L395,345 L400,370 L390,395 L375,400 L365,385 Z" },
  { name: "Togo", d: "M400,355 L408,350 L412,370 L410,395 L400,400 L398,375 Z" },
  { name: "Benin", d: "M412,345 L425,335 L435,345 L430,375 L420,400 L410,400 L412,370 Z" },
  { name: "Nigeria", d: "M430,305 L450,315 L475,320 L500,325 L510,340 L505,365 L490,385 L470,395 L445,400 L430,390 L420,375 L425,355 L430,335 L435,320 Z" },
  { name: "Cameroon", d: "M500,340 L520,340 L535,355 L540,380 L530,405 L515,415 L500,400 L490,385 L495,365 L505,350 Z" },
  // Central Africa
  { name: "Central African Republic", d: "M540,340 L565,335 L595,340 L615,355 L610,375 L590,385 L565,380 L540,375 L535,355 Z" },
  { name: "Equatorial Guinea", d: "M485,420 L500,418 L502,430 L488,432 Z" },
  { name: "Gabon", d: "M490,435 L510,425 L525,435 L530,460 L520,480 L500,485 L488,470 L485,450 Z" },
  { name: "Congo", d: "M525,400 L545,390 L560,400 L555,430 L545,455 L530,465 L520,450 L525,435 L515,420 Z" },
  { name: "DRC", d: "M555,385 L580,375 L610,380 L635,395 L650,420 L660,450 L655,480 L640,510 L620,530 L600,540 L575,535 L555,520 L545,500 L540,475 L545,455 L555,430 L560,400 Z" },
  { name: "São Tomé and Príncipe", d: "M460,440 L468,438 L470,445 L462,447 Z" },
  // East Africa
  { name: "Sudan", d: "M590,195 L620,190 L645,200 L660,225 L665,260 L655,295 L635,320 L610,330 L590,325 L575,305 L575,270 L580,240 L585,215 Z" },
  { name: "South Sudan", d: "M590,330 L615,325 L640,335 L650,355 L640,375 L615,385 L595,380 L580,365 L575,345 Z" },
  { name: "Eritrea", d: "M645,200 L670,195 L685,210 L680,225 L665,230 L655,225 L660,210 Z" },
  { name: "Djibouti", d: "M690,235 L700,230 L705,242 L695,248 Z" },
  { name: "Ethiopia", d: "M640,250 L665,235 L695,248 L710,270 L700,300 L675,315 L650,320 L635,310 L630,290 L635,265 Z" },
  { name: "Somalia", d: "M710,270 L730,255 L745,280 L740,320 L720,360 L700,385 L685,370 L680,340 L685,315 L700,300 Z" },
  { name: "Kenya", d: "M650,370 L675,355 L695,370 L700,400 L690,425 L670,435 L650,425 L640,400 L645,385 Z" },
  { name: "Uganda", d: "M620,380 L645,375 L655,395 L650,415 L630,420 L615,410 L612,395 Z" },
  { name: "Rwanda", d: "M615,430 L630,425 L635,438 L625,445 L615,440 Z" },
  { name: "Burundi", d: "M615,445 L628,442 L632,455 L622,460 L614,452 Z" },
  { name: "Tanzania", d: "M635,435 L660,430 L685,440 L700,460 L695,490 L680,510 L655,515 L635,500 L625,480 L620,460 L630,445 Z" },
  // Southern Africa
  { name: "Angola", d: "M480,490 L510,480 L540,485 L555,500 L555,530 L545,560 L530,585 L510,590 L490,580 L475,555 L470,525 L475,505 Z" },
  { name: "Zambia", d: "M560,490 L590,485 L615,495 L630,515 L625,545 L610,560 L585,565 L560,555 L550,535 L555,510 Z" },
  { name: "Malawi", d: "M640,490 L650,485 L658,500 L655,530 L645,545 L635,535 L633,510 Z" },
  { name: "Mozambique", d: "M650,510 L670,505 L685,520 L690,555 L680,590 L665,620 L645,635 L630,625 L625,600 L630,575 L640,555 L645,530 Z" },
  { name: "Zimbabwe", d: "M600,560 L625,555 L640,565 L640,590 L625,605 L605,605 L590,595 L590,575 Z" },
  { name: "Namibia", d: "M470,580 L510,590 L530,600 L540,625 L535,660 L520,690 L500,700 L475,695 L460,670 L455,640 L460,610 Z" },
  { name: "Botswana", d: "M535,600 L560,590 L585,595 L595,620 L585,650 L565,660 L545,655 L535,635 Z" },
  { name: "South Africa", d: "M500,700 L530,695 L555,690 L580,685 L605,690 L630,700 L645,720 L640,750 L620,770 L595,780 L570,775 L545,765 L520,750 L505,730 Z" },
  { name: "Eswatini", d: "M630,695 L640,690 L645,700 L638,705 Z" },
  { name: "Lesotho", d: "M585,740 L600,735 L605,748 L595,755 L583,748 Z" },
  { name: "Madagascar", d: "M720,560 L740,550 L755,570 L760,610 L750,650 L735,670 L720,660 L715,620 L710,590 Z" },
  { name: "Comoros", d: "M700,510 L710,508 L712,515 L703,517 Z" },
  { name: "Seychelles", d: "M760,470 L768,468 L770,475 L762,477 Z" },
  { name: "Mauritius", d: "M775,620 L783,618 L785,628 L777,630 Z" },
  { name: "Cabo Verde", d: "M195,295 L208,292 L210,302 L200,305 Z" },
];

const AfricaMap: React.FC<AfricaMapProps> = ({ onCountrySelect, selectedCountry }) => {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Pre-compute centroids for labels
  const centroids = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    COUNTRIES.forEach(({ name, d }) => {
      const nums = d.match(/[\d.]+/g)?.map(Number) || [];
      let sx = 0, sy = 0, count = 0;
      for (let i = 0; i < nums.length - 1; i += 2) {
        sx += nums[i];
        sy += nums[i + 1];
        count++;
      }
      if (count) map[name] = { x: sx / count, y: sy / count };
    });
    return map;
  }, []);

  const handleMouseMove = (e: React.MouseEvent<SVGElement>, name: string) => {
    const svg = e.currentTarget.closest('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top - 10,
    });
    setHoveredCountry(name);
  };

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/60 to-gray-900/80" />

      <svg
        viewBox="170 60 640 740"
        className="w-full h-full relative z-10"
        style={{ filter: 'drop-shadow(0 0 20px rgba(34,197,94,0.05))' }}
      >
        {/* Water / background pattern */}
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="rgba(34,197,94,0.06)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <filter id="countryGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient glow */}
        <rect x="170" y="60" width="640" height="740" fill="url(#mapGlow)" />

        {/* Country paths */}
        {COUNTRIES.map(({ name, d }) => {
          const isSelected = selectedCountry === name;
          const isHovered = hoveredCountry === name;
          const isActive = isSelected || isHovered;

          return (
            <path
              key={name}
              d={d}
              onClick={() => onCountrySelect(name)}
              onMouseMove={(e) => handleMouseMove(e, name)}
              onMouseLeave={() => setHoveredCountry(null)}
              fill={
                isSelected
                  ? 'rgba(34,197,94,0.45)'
                  : isHovered
                  ? 'rgba(34,197,94,0.25)'
                  : 'rgba(255,255,255,0.07)'
              }
              stroke={
                isSelected
                  ? '#22C55E'
                  : isHovered
                  ? 'rgba(34,197,94,0.6)'
                  : 'rgba(255,255,255,0.15)'
              }
              strokeWidth={isActive ? 1.5 : 0.7}
              className="cursor-pointer transition-all duration-200"
              style={{
                filter: isSelected ? 'url(#countryGlow)' : undefined,
              }}
            />
          );
        })}

        {/* Labels for larger countries only */}
        {['Nigeria', 'Egypt', 'Ethiopia', 'Kenya', 'South Africa', 'DRC', 'Algeria', 'Tanzania', 'Morocco', 'Angola', 'Mali', 'Niger', 'Chad', 'Sudan', 'Libya', 'Somalia', 'Madagascar', 'Mozambique', 'Zambia', 'Zimbabwe', 'Ghana', 'Cameroon', 'Namibia', 'Botswana', 'Uganda'].map((name) => {
          const c = centroids[name];
          if (!c) return null;
          const isActive = selectedCountry === name || hoveredCountry === name;
          return (
            <text
              key={`label-${name}`}
              x={c.x}
              y={c.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="pointer-events-none select-none"
              style={{
                fontSize: isActive ? '9px' : '7px',
                fontWeight: isActive ? 600 : 400,
                fill: isActive ? '#fff' : 'rgba(255,255,255,0.35)',
                transition: 'all 0.2s',
              }}
            >
              {name === 'South Africa' ? 'S. Africa' : name === 'Central African Republic' ? 'CAR' : name}
            </text>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredCountry && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-lg px-3 py-1.5 shadow-xl">
            <p className="text-xs font-medium text-white whitespace-nowrap">{hoveredCountry}</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-3 text-[10px] text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-sm bg-white/[0.07] border border-white/10" />
          <span>Hover to explore</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-sm bg-emerald-500/40 border border-emerald-500/60" />
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
};

export default AfricaMap;
