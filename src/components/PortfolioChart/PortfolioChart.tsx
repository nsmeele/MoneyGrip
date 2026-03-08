import { useId, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceDot, ResponsiveContainer } from 'recharts';
import type { BankAccount } from '../../models/BankAccount';
import type { ChartYearRange } from '../../enums/ChartYearRange';
import { buildPortfolioChartData, filterPortfolioChartData, type ChartDataPoint } from '../../utils/interest';
import { getRangeEndYear } from '../../utils/chartRange';
import { formatCurrency } from '../../utils/format';
import { useLocale } from '../../context/useLocale';
import { DEFAULT_CURRENCY } from '../../enums/Currency';
import { useTheme } from '../../hooks/useTheme';
import ChartRangeSelector from '../ChartRangeSelector';
import './PortfolioChart.css';

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint; value: number }>;
  label?: string;
  currency?: string;
}

function ChartTooltip({ active, payload, currency = DEFAULT_CURRENCY }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="portfolio-chart__tooltip">
      <div className="portfolio-chart__tooltip-label">{payload[0].payload.label}</div>
      <div className="portfolio-chart__tooltip-value">{formatCurrency(payload[0].value as number, currency)}</div>
    </div>
  );
}

const chartColors = {
  light: { grid: '#dce6f5', tick: '#4a7cc4', axis: '#dce6f5', stroke: '#c8956c', dotStroke: '#eef3fa', refLine: 'rgba(200,149,108,0.4)' },
  dark:  { grid: '#163058', tick: '#7ba3db', axis: '#163058', stroke: '#d4a87e', dotStroke: '#0f2240', refLine: 'rgba(212,168,126,0.45)' },
};

interface PortfolioChartProps {
  items: BankAccount[];
  viewMode?: 'accrued' | 'disbursed';
  selectedMonthKey?: string | null;
  onMonthSelect?: (monthKey: string) => void;
  startYear: number;
  onStartYearChange: (year: number) => void;
  yearRange: ChartYearRange;
  onRangeChange: (range: ChartYearRange) => void;
  minYear?: number;
}

export default function PortfolioChart({ items, viewMode = 'accrued', selectedMonthKey = null, onMonthSelect, startYear, onStartYearChange, yearRange, onRangeChange, minYear }: PortfolioChartProps) {
  const { t } = useTranslation();
  const { currency: globalCurrency } = useLocale();
  const { theme } = useTheme();
  const gradientId = useId();
  const colors = chartColors[theme];
  const endYear = getRangeEndYear(startYear, yearRange);
  const data = useMemo(() => {
    const raw = buildPortfolioChartData(items, viewMode);
    return filterPortfolioChartData(raw, startYear, endYear);
  }, [items, viewMode, startYear, endYear]);

  const labelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of data) map.set(d.monthKey, d.label);
    return map;
  }, [data]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChartClick = useCallback((state: any) => {
    if (!onMonthSelect || !state?.activeLabel) return;
    onMonthSelect(state.activeLabel as string);
  }, [onMonthSelect]);

  if (data.length === 0) return null;

  const maxLabelCount = 12;
  const tickInterval = data.length <= maxLabelCount ? 0 : Math.ceil(data.length / maxLabelCount) - 1;

  const selectedPoint = selectedMonthKey
    ? data.find((d) => d.monthKey === selectedMonthKey)
    : null;

  return (
    <section className="portfolio-chart" aria-label={t('portfolio.chartAriaLabel')}>
      <ChartRangeSelector startYear={startYear} onStartYearChange={onStartYearChange} value={yearRange} onChange={onRangeChange} minYear={minYear} />
      <div className="portfolio-chart__container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }} onClick={handleChartClick}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.stroke} stopOpacity={0.3} />
                <stop offset="100%" stopColor={colors.stroke} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
            <XAxis
              dataKey="monthKey"
              tick={{ fontSize: 10, fill: colors.tick }}
              tickLine={false}
              axisLine={{ stroke: colors.axis }}
              interval={tickInterval}
              tickFormatter={(key: string) => labelMap.get(key) ?? key}
            />
            <YAxis
              tick={{ fontSize: 10, fill: colors.tick }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatCurrency(Math.round(v), globalCurrency)}
            />
            <Tooltip content={<ChartTooltip currency={globalCurrency} />} />
            <Area
              type="monotone"
              dataKey="interest"
              stroke={colors.stroke}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              animationDuration={600}
              animationEasing="ease-out"
            />
            {selectedPoint && (
              <>
                <ReferenceLine x={selectedPoint.monthKey} stroke={colors.refLine} strokeDasharray="4 4" />
                <ReferenceDot x={selectedPoint.monthKey} y={selectedPoint.interest} r={5} fill={colors.stroke} stroke={colors.dotStroke} strokeWidth={2} />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
