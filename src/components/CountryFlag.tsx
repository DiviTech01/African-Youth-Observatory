import React from 'react';
import { getFlagUrl, getFlagSrcSet } from '@/lib/country-flags';

interface CountryFlagProps {
  country: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showName?: boolean;
}

const sizeMap = {
  xs: { width: 16, height: 12, imgWidth: 20, textClass: 'text-xs' },
  sm: { width: 20, height: 15, imgWidth: 40, textClass: 'text-sm' },
  md: { width: 28, height: 21, imgWidth: 40, textClass: 'text-sm' },
  lg: { width: 40, height: 30, imgWidth: 80, textClass: 'text-base' },
  xl: { width: 64, height: 48, imgWidth: 80, textClass: 'text-lg' },
};

const CountryFlag = ({ country, size = 'sm', className = '', showName = false }: CountryFlagProps) => {
  const { width, height, imgWidth, textClass } = sizeMap[size];
  const flagUrl = getFlagUrl(country, imgWidth);
  const srcSet = getFlagSrcSet(country, imgWidth);

  if (!flagUrl) {
    return showName ? <span className={`${textClass} ${className}`}>{country}</span> : null;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <img
        src={flagUrl}
        srcSet={srcSet}
        alt={`${country} flag`}
        width={width}
        height={height}
        className="rounded-[2px] object-cover shadow-sm border border-border/30"
        loading="lazy"
      />
      {showName && <span className={`${textClass} font-medium`}>{country}</span>}
    </span>
  );
};

export default CountryFlag;
