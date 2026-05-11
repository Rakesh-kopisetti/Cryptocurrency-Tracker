import { memo } from 'react';

type ChartProps = {
  values: number[];
  testId: string;
  height?: number;
  width?: number | string;
  stroke?: string;
  fill?: string;
};

function buildPath(values: number[], width: number, height: number): string {
  if (values.length === 0) {
    return '';
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * width;
      const y = height - ((value - min) / span) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function Chart({ values, testId, height = 56, width = '100%', stroke = '#2f80ed' }: ChartProps) {
  const numericWidth = 220;
  const safeValues = values.length > 1 ? values : [values[0] ?? 0, values[0] ?? 0];
  const path = buildPath(safeValues, numericWidth, height);

  return (
    <svg data-testid={testId} viewBox={`0 0 ${numericWidth} ${height}`} preserveAspectRatio="none" width={width} height={height} role="img" aria-label="Price chart">
      <defs>
        <linearGradient id={`${testId}-gradient`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${numericWidth} ${height} L 0 ${height} Z`} fill={`url(#${testId}-gradient)`} stroke="none" />
      <path d={path} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const SparklineChart = memo(Chart);
export const PriceChart = memo(Chart);