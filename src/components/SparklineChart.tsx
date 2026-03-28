import React, { useMemo } from 'react';
import { LineChart, Line } from 'recharts';

interface SparklineChartProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  color = 'hsl(var(--primary))',
  width = 80,
  height = 24,
}) => {
  const chartData = useMemo(
    () => data.map((value) => ({ v: value })),
    [data]
  );

  if (data.length < 2) return null;

  return (
    <LineChart width={width} height={height} data={chartData}>
      <Line
        type="monotone"
        dataKey="v"
        stroke={color}
        strokeWidth={1.5}
        dot={false}
        isAnimationActive={false}
      />
    </LineChart>
  );
};

export default SparklineChart;
