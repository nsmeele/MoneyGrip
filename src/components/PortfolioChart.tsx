import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { BankAccount } from '../models/BankAccount';
import { buildPortfolioChartData } from '../utils/interest';
import { formatCurrency } from '../utils/format';

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

interface PortfolioChartProps {
  items: BankAccount[];
}

export default function PortfolioChart({ items }: PortfolioChartProps) {
  const data = useMemo(() => buildPortfolioChartData(items), [items]);

  if (data.length === 0) return null;

  const maxLabelCount = 12;
  const tickInterval = data.length <= maxLabelCount ? 0 : Math.ceil(data.length / maxLabelCount) - 1;

  return (
    <section className="portfolio-chart" aria-label="Maandelijkse rente-opbrengst grafiek">
      <div className="portfolio-chart__container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="copperGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c8956c" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#c8956c" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#dce6f5" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#4a7cc4' }}
              tickLine={false}
              axisLine={{ stroke: '#dce6f5' }}
              interval={tickInterval}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#4a7cc4' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `€${Math.round(v)}`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="interest"
              stroke="#c8956c"
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
