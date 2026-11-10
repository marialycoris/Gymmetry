import type { ReactNode } from 'react';

const CHART_COLORS = ['#F21137', '#68020F', '#FB7185', '#9F1239', '#FCA5A5', '#4C0519', '#D1D5DB'];

export interface ChartItem {
  label: string;
  value: number;
  display?: string;
  color?: string;
}

interface DonutChartProps {
  items: ChartItem[];
  size?: number;
  thickness?: number;
  centerValue?: ReactNode;
  centerLabel?: string;
}

/** Donut chart with a built-in legend. Good for parts of a whole. */
export function DonutChart({ items, size = 144, thickness = 20, centerValue, centerLabel }: DonutChartProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Donut chart">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F3F4F6" strokeWidth={thickness} />
          {total > 0 && items.map((item, index) => {
            const length = (item.value / total) * circumference;
            const segment = (
              <circle
                key={item.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color ?? CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={thickness}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
            offset += length;
            return segment;
          })}
        </svg>
        {(centerValue !== undefined || centerLabel) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {centerValue !== undefined && <span className="font-display text-xl font-extrabold leading-none">{centerValue}</span>}
            {centerLabel && <span className="mt-1 text-[11px] font-semibold text-gray-500">{centerLabel}</span>}
          </div>
        )}
      </div>
      <ul className="w-full space-y-1.5">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color ?? CHART_COLORS[index % CHART_COLORS.length] }} />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="shrink-0 font-semibold text-gray-700">{item.display ?? item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface BarChartProps {
  items: ChartItem[];
  height?: number;
}

/** Vertical bar chart. Good for comparing counts across categories. */
export function BarChart({ items, height = 120 }: BarChartProps) {
  const max = Math.max(1, ...items.map((item) => item.value));
  const maxBar = height - 24;

  return (
    <div className="flex w-full flex-col">
      <div className="flex items-end gap-2" style={{ height }}>
        {items.map((item, index) => (
          <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center justify-end">
            <span className="mb-1 text-xs font-bold text-gray-700">{item.display ?? item.value}</span>
            <div
              className="w-full max-w-10 rounded-t-md"
              style={{ height: `${Math.max(3, (item.value / max) * maxBar)}px`, backgroundColor: item.color ?? CHART_COLORS[index % CHART_COLORS.length] }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {items.map((item) => (
          <span key={item.label} className="min-w-0 flex-1 text-center text-[11px] leading-tight text-gray-500">{item.label}</span>
        ))}
      </div>
    </div>
  );
}

interface StackedItem {
  label: string;
  values: number[];
}

interface StackedBarChartProps {
  items: StackedItem[];
  series: { label: string; color: string }[];
}

/** Horizontal stacked bars with per-series legend. Good for held vs not held. */
export function StackedBarChart({ items, series }: StackedBarChartProps) {
  return (
    <div className="w-full space-y-4">
      {items.map((item) => {
        const total = item.values.reduce((sum, value) => sum + value, 0);
        return (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-semibold text-gray-700">{item.label}</span>
              <span className="shrink-0 text-gray-500">{total} session{total === 1 ? '' : 's'}</span>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
              {item.values.map((value, index) => (
                <div
                  key={series[index].label}
                  className="h-full"
                  style={{ width: `${total ? (value / total) * 100 : 0}%`, backgroundColor: series[index].color }}
                  title={`${series[index].label}: ${value}`}
                />
              ))}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-gray-500">
              {item.values.map((value, index) => (
                <span key={series[index].label}>{series[index].label} {value}</span>
              ))}
            </div>
          </div>
        );
      })}
      <div className="flex flex-wrap gap-4 pt-1 text-xs text-gray-500">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
