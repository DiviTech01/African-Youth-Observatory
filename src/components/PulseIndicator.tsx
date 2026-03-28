import React from 'react';

interface PulseIndicatorProps {
  color?: 'green' | 'yellow' | 'red';
  label?: string;
}

const colorMap = {
  green: {
    dot: 'bg-green-500',
    ring: 'bg-green-400',
  },
  yellow: {
    dot: 'bg-yellow-500',
    ring: 'bg-yellow-400',
  },
  red: {
    dot: 'bg-red-500',
    ring: 'bg-red-400',
  },
};

export const PulseIndicator: React.FC<PulseIndicatorProps> = ({
  color = 'green',
  label,
}) => {
  const colors = colorMap[color];

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-[6px] w-[6px]">
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${colors.ring}`}
        />
        <span
          className={`relative inline-flex h-[6px] w-[6px] rounded-full ${colors.dot}`}
        />
      </span>
      {label && (
        <span className="text-[11px] font-medium text-muted-foreground leading-none">
          {label}
        </span>
      )}
    </span>
  );
};

export default PulseIndicator;
