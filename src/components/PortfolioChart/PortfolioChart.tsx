import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { BankAccount } from '../../models/BankAccount';
import { buildPortfolioChartData } from '../../utils/interest';
import { formatCurrency } from '../../utils/format';
import { useTheme } from '../../hooks/useTheme';
import './PortfolioChart.css';

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="portfolio-chart__tooltip">
      <div className="portfolio-chart__tooltip-label">{label}</div>
      <div className="portfolio-chart__tooltip-value">{formatCurrency(payload[0].value as number)}</div>
    </div>
  );
}

const chartColors = {
  light: { grid: '#dce6f5', tick: '#4a7cc4', axis: '#dce6f5', stroke: '#c8956c', fillStart: 'rgba(200,149,108,0.3)', fillEnd: 'rgba(200,149,108,0.03)' },
  dark:  { grid: '#163058', tick: '#7ba3db', axis: '#163058', stroke: '#d4a87e', fillStart: 'rgba(212,168,126,0.35)', fillEnd: 'rgba(212,168,126,0.03)' },
};

interface PortfolioChartProps {
  items: BankAccount[];
  viewMode?: 'accrued' | 'disbursed';
}

export default function PortfolioChart({ items, viewMode = 'accrued' }: PortfolioChartProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = chartColors[theme];
  const data = useMemo(() => buildPortfolioChartData(items, viewMode), [items, viewMode]);

  if (data.length === 0) return null;

  const maxLabelCount = 12;
  const tickInterval = data.length <= maxLabelCount ? 0 : Math.ceil(data.length / maxLabelCount) - 1;

  return (
    <section className="portfolio-chart" aria-label={t('portfolio.chartAriaLabel')}>
      <div className="portfolio-chart__container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="copperGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.stroke} stopOpacity={0.3} />
                <stop offset="100%" stopColor={colors.stroke} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: colors.tick }}
              tickLine={false}
              axisLine={{ stroke: colors.axis }}
              interval={tickInterval}
            />
            <YAxis
              tick={{ fontSize: 10, fill: colors.tick }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `€${Math.round(v)}`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="interest"
              stroke={colors.stroke}
              strokeWidth={2}
              fill="url(#copperGradient)"
              animationDuration={600}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
