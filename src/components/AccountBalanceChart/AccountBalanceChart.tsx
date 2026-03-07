import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { BankAccount } from '../../models/BankAccount';
import { buildPortfolioChartData } from '../../utils/interest';
import { formatCurrency } from '../../utils/format';
import { useTheme } from '../../hooks/useTheme';
import './AccountBalanceChart.css';

interface CombinedDataPoint {
  label: string;
  accrued: number;
  disbursed: number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
  currency: string;
  accruedLabel: string;
  disbursedLabel: string;
}

function ChartTooltip({ active, payload, label, currency, accruedLabel, disbursedLabel }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="account-chart__tooltip">
      <div className="account-chart__tooltip-label">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="account-chart__tooltip-row">
          <span className={`account-chart__tooltip-dot account-chart__tooltip-dot--${entry.dataKey}`} />
          <span className="account-chart__tooltip-name">
            {entry.dataKey === 'accrued' ? accruedLabel : disbursedLabel}
          </span>
          <span className="account-chart__tooltip-value">{formatCurrency(entry.value, currency)}</span>
        </div>
      ))}
    </div>
  );
}

const chartColors = {
  light: { grid: '#dce6f5', tick: '#4a7cc4', axis: '#dce6f5', accrued: '#c8956c', disbursed: '#2a5494' },
  dark:  { grid: '#163058', tick: '#7ba3db', axis: '#163058', accrued: '#d4a87e', disbursed: '#7ba3db' },
};

function buildCombinedData(account: BankAccount): CombinedDataPoint[] {
  const accruedData = buildPortfolioChartData([account], 'accrued');
  const disbursedData = buildPortfolioChartData([account], 'disbursed');

  const disbursedMap = new Map(disbursedData.map((d) => [d.monthKey, d.interest]));

  return accruedData.map((d) => ({
    label: d.label,
    accrued: d.interest,
    disbursed: disbursedMap.get(d.monthKey) ?? 0,
  }));
}

interface AccountBalanceChartProps {
  account: BankAccount;
  currency: string;
}

export default function AccountBalanceChart({ account, currency }: AccountBalanceChartProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = chartColors[theme];
  const data = useMemo(() => buildCombinedData(account), [account]);

  if (data.length < 2) return null;

  const hasDisbursed = data.some((d) => d.disbursed > 0);
  const maxLabelCount = 12;
  const tickInterval = data.length <= maxLabelCount ? 0 : Math.ceil(data.length / maxLabelCount) - 1;

  return (
    <section className="account-chart" aria-label={t('detail.chartLabel')}>
      <h2>{t('detail.chartLabel')}</h2>
      <div className="account-chart__container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="accruedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.accrued} stopOpacity={0.25} />
                <stop offset="100%" stopColor={colors.accrued} stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="disbursedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.disbursed} stopOpacity={0.15} />
                <stop offset="100%" stopColor={colors.disbursed} stopOpacity={0.02} />
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
              tickFormatter={(v: number) => formatCurrency(Math.round(v), currency)}
            />
            <Tooltip content={
              <ChartTooltip
                currency={currency}
                accruedLabel={t('portfolio.accrued')}
                disbursedLabel={t('portfolio.disbursed')}
              />
            } />
            <Area
              type="monotone"
              dataKey="accrued"
              stroke={colors.accrued}
              strokeWidth={2}
              fill="url(#accruedGradient)"
              animationDuration={600}
              animationEasing="ease-out"
            />
            {hasDisbursed && (
              <Area
                type="monotone"
                dataKey="disbursed"
                stroke={colors.disbursed}
                strokeWidth={2}
                fill="url(#disbursedGradient)"
                animationDuration={600}
                animationEasing="ease-out"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
