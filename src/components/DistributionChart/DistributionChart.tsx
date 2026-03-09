import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { BankAccount } from '../../models/BankAccount';
import type { MaturityEvent } from '../../utils/collectMaturities';
import type { ReinvestmentAllocation } from '../../models/ReinvestmentAllocation';
import type { ChartYearRange } from '../../enums/ChartYearRange';
import { buildDistributionData, type DistributionDataPoint } from '../../utils/distributionChart';
import { getRangeEndYear } from '../../utils/chartRange';
import { formatCurrency } from '../../utils/format';
import { useLocale } from '../../context/useLocale';
import { DEFAULT_CURRENCY } from '../../enums/Currency';
import { useTheme } from '../../hooks/useTheme';
import { useContainerWidth } from '../../hooks/useContainerWidth';
import { getChartColors } from '../../utils/chartColors';
import { getTickInterval, formatCompactCurrency } from '../../utils/chartAxis';
import ChartRangeSelector from '../ChartRangeSelector';
import './DistributionChart.css';

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DistributionDataPoint; value: number; dataKey: string }>;
  currency?: string;
}

function ChartTooltip({ active, payload, currency = DEFAULT_CURRENCY }: ChartTooltipProps) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;
  const total = point.variable + point.fixed;

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__label">{point.label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="chart-tooltip__row">
          <span className="chart-tooltip__row-label">
            {t(`reinvest.distribution.${entry.dataKey}`)}
          </span>
          <span className="chart-tooltip__value">
            {formatCurrency(entry.value, currency)}
          </span>
        </div>
      ))}
      <div className="chart-tooltip__row chart-tooltip__row--total">
        <span className="chart-tooltip__row-label">{t('reinvest.distribution.total')}</span>
        <span className="chart-tooltip__value">{formatCurrency(total, currency)}</span>
      </div>
    </div>
  );
}

const distributionColors = {
  light: { variable: '#c8956c', fixed: '#2a5494' },
  dark:  { variable: '#d4a87e', fixed: '#7ba3db' },
};

interface DistributionChartProps {
  items: BankAccount[];
  events: MaturityEvent[];
  allocations: ReinvestmentAllocation[];
  startYear: number;
  onStartYearChange: (year: number) => void;
  yearRange: ChartYearRange;
  onRangeChange: (range: ChartYearRange) => void;
  minYear?: number;
}

export default function DistributionChart({ items, events, allocations, startYear, onStartYearChange, yearRange, onRangeChange, minYear }: DistributionChartProps) {
  const { t } = useTranslation();
  const { currency: globalCurrency } = useLocale();
  const { theme } = useTheme();
  const base = getChartColors();
  const colors = distributionColors[theme];
  const [containerRef, containerWidth] = useContainerWidth();
  const endYear = getRangeEndYear(startYear, yearRange);

  const data = useMemo(
    () => buildDistributionData(items, startYear, endYear, events, allocations),
    [items, startYear, endYear, events, allocations],
  );

  const labelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of data) map.set(d.monthKey, d.label);
    return map;
  }, [data]);

  if (data.length === 0) return null;

  const tickInterval = getTickInterval(data.length, containerWidth);

  return (
    <section className="distribution-chart" aria-label={t('reinvest.distribution.chartAriaLabel')}>
      <h2 className="distribution-chart__title">{t('reinvest.distribution.title')}</h2>
      <ChartRangeSelector startYear={startYear} onStartYearChange={onStartYearChange} value={yearRange} onChange={onRangeChange} minYear={minYear} />
      <div className="chart-container" ref={containerRef}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={base.grid} vertical={false} />
            <XAxis
              dataKey="monthKey"
              tick={{ fontSize: 10, fill: base.tick }}
              tickLine={false}
              axisLine={{ stroke: base.axis }}
              interval={tickInterval}
              tickFormatter={(key: string) => labelMap.get(key) ?? key}
            />
            <YAxis
              tick={{ fontSize: 10, fill: base.tick }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatCompactCurrency(v, globalCurrency)}
            />
            <Tooltip content={<ChartTooltip currency={globalCurrency} />} />
            <Legend
              formatter={(value: string) => t(`reinvest.distribution.${value}`)}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Bar
              dataKey="variable"
              stackId="distribution"
              fill={colors.variable}
              radius={[2, 2, 0, 0]}
              animationDuration={600}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="fixed"
              stackId="distribution"
              fill={colors.fixed}
              radius={[2, 2, 0, 0]}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
