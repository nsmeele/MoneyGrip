import { useState, useMemo } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import type { BankAccount } from '../../models/BankAccount';
import { expandCashFlows } from '../../models/CashFlow';
import { INTERVAL_LABELS } from '../../enums/PayoutInterval';
import { formatCurrency } from '../../utils/format';
import { toMonthKey, addMonthsToISO, todayISO, toISO, getNextMonthStart, parseDate } from '../../utils/date';
import { yearFraction } from '../../utils/dayCount';
import { getRateForDate } from '../../utils/rateChange';
import PortfolioChart from '../PortfolioChart';
import './PortfolioSummary.css';

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(d);
}

import { itemStatusForMonth } from '../../utils/portfolioStatus';

interface DayRow {
  date: string;
  balance: number;
  rate: number;
  dayInterest: number;
  cumulative: number;
}

function addDay(iso: string): string {
  const d = parseDate(iso);
  d.setDate(d.getDate() + 1);
  return toISO(d);
}

function getMonthDays(account: BankAccount, monthKey: string): DayRow[] {
  if (!account.startDate || account.periods.length === 0) return [];

  const monthStart = `${monthKey}-01`;
  const monthEnd = getNextMonthStart(monthStart);
  const endISO = account.endDate ?? addMonthsToISO(account.startDate, account.durationMonths);
  const allCashFlows = expandCashFlows(account.cashFlows, endISO);

  // Build a map: for each day in the month, what balance and rate apply?
  // Walk through periods and track balance changes from cash flows.
  const dayMap = new Map<string, { balance: number; rate: number }>();

  for (let i = 0; i < account.periods.length; i++) {
    const period = account.periods[i];
    const periodStart = i === 0 ? account.startDate : account.periods[i - 1].endDate!;
    const periodEnd = period.endDate;
    if (!periodEnd) continue;
    if (periodEnd <= monthStart || periodStart >= monthEnd) continue;

    // Replay balance to period start, then walk day by day
    let balance = period.startBalance;

    // Apply cash flows before the month within this period
    for (const cf of allCashFlows) {
      if (cf.date >= periodStart && cf.date < monthStart) {
        balance = Math.max(0, balance + Math.max(-balance, cf.amount));
      }
    }

    const sliceStart = periodStart > monthStart ? periodStart : monthStart;
    const sliceEnd = periodEnd < monthEnd ? periodEnd : monthEnd;

    let day = sliceStart;
    while (day < sliceEnd) {
      // Apply cash flows on this day
      for (const cf of allCashFlows) {
        if (cf.date === day && day >= periodStart) {
          balance = Math.max(0, balance + Math.max(-balance, cf.amount));
        }
      }

      const rate = getRateForDate(account.rateChanges, account.annualInterestRate, day);
      dayMap.set(day, { balance, rate });
      day = addDay(day);
    }
  }

  // Now compute daily interest and cumulative
  const rows: DayRow[] = [];
  let cumulative = 0;

  let cursor = monthStart;
  while (cursor < monthEnd) {
    const entry = dayMap.get(cursor);
    if (entry) {
      const nextDay = addDay(cursor);
      const dayInterest = entry.balance * (entry.rate / 100) * yearFraction(cursor, nextDay, account.dayCount);
      cumulative += dayInterest;
      rows.push({ date: cursor, balance: entry.balance, rate: entry.rate, dayInterest, cumulative });
    }
    cursor = addDay(cursor);
  }

  return rows;
}

interface PortfolioSummaryProps {
  results: BankAccount[];
  portfolioIds: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
}

export default function PortfolioSummary({ results, portfolioIds, onToggle, onClear }: PortfolioSummaryProps) {
  const items = results.filter((r) => portfolioIds.has(r.id));
  const currentMonthKey = toMonthKey(todayISO());
  const [monthOffset, setMonthOffset] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'accrued' | 'disbursed'>('accrued');
  const [showInactive, setShowInactive] = useState(false);

  const selectedMonthKey = useMemo(() => {
    if (monthOffset === 0) return currentMonthKey;
    const shifted = addMonthsToISO(`${currentMonthKey}-01`, monthOffset);
    return toMonthKey(shifted);
  }, [currentMonthKey, monthOffset]);

  const monthBounds = useMemo(() => {
    let min = '';
    let max = '';
    for (const r of items) {
      for (const key of r.calendarMonthProjection.keys()) {
        if (!min || key < min) min = key;
        if (!max || key > max) max = key;
      }
    }
    return { min, max };
  }, [items]);

  if (items.length === 0) return null;

  const atStart = monthBounds.min !== '' && selectedMonthKey <= monthBounds.min;
  const atEnd = monthBounds.max !== '' && selectedMonthKey >= monthBounds.max;

  const totalInterest = items.reduce((sum, r) => sum + r.totalInterest, 0);
  const totalDisbursed = items.reduce((sum, r) => sum + r.totalDisbursed, 0);

  const totalForMonth = items.reduce((sum, r) => {
    const projection = viewMode === 'disbursed' ? r.calendarMonthDisbursement : r.calendarMonthProjection;
    return sum + (projection.get(selectedMonthKey) ?? 0);
  }, 0);

  const monthEnd = getNextMonthStart(`${selectedMonthKey}-01`);

  const activeForMonth = items.filter((r) => itemStatusForMonth(r, selectedMonthKey) === 'active');

  const totalInvested = activeForMonth.reduce((sum, r) => {
    const deposited = r.periods
      .filter((p) => p.endDate && p.endDate <= monthEnd)
      .reduce((s, p) => s + (p.deposited ?? 0), 0);
    return sum + r.startAmount + deposited;
  }, 0);

  const isCurrentMonth = monthOffset === 0;

  return (
    <section className="portfolio-section" aria-label="Portefeuille">
      <div className="section-header">
        <div className="section-header__title">
          <h2>
            Portefeuille
            <span className="results-count">{items.length}</span>
          </h2>
        </div>
        <div className="section-header__actions">
          <button className="btn-action btn-action--danger" onClick={onClear}>
            Leegmaken
          </button>
        </div>
      </div>

      <nav className="portfolio-tabs" aria-label="Weergave">
        <button
          className={`portfolio-tabs__tab${viewMode === 'accrued' ? ' portfolio-tabs__tab--active' : ''}`}
          onClick={() => setViewMode('accrued')}
        >
          Opgebouwd
        </button>
        <button
          className={`portfolio-tabs__tab${viewMode === 'disbursed' ? ' portfolio-tabs__tab--active' : ''}`}
          onClick={() => setViewMode('disbursed')}
        >
          Uitbetaald
        </button>
      </nav>

      <div className="portfolio-stats">
        <div className="portfolio-stat">
          <div className="portfolio-stat-label">Totaal ingelegd</div>
          <div className="portfolio-stat-value">{formatCurrency(totalInvested)}</div>
        </div>
        <div className="portfolio-stat">
          <div className="portfolio-stat-label">{viewMode === 'disbursed' ? 'Totaal uitbetaald' : 'Totale rente'}</div>
          <div className="portfolio-stat-value">{formatCurrency(viewMode === 'disbursed' ? totalDisbursed : totalInterest)}</div>
        </div>
        <div className="portfolio-stat portfolio-stat--highlight">
          <div className="month-nav">
            <button
              className="month-nav__btn"
              onClick={() => setMonthOffset((o) => o - 1)}
              disabled={atStart}
              aria-label="Vorige maand"
            >
              <ChevronLeftIcon aria-hidden="true" />
            </button>
            <div className="month-nav__label">
              <span className="portfolio-stat-label">{formatMonthLabel(selectedMonthKey)}</span>
              {isCurrentMonth
                ? <span className="month-nav__current">nu</span>
                : <button className="month-nav__reset" onClick={() => setMonthOffset(0)} aria-label="Terug naar huidige maand">nu</button>
              }
            </div>
            <button
              className="month-nav__btn"
              onClick={() => setMonthOffset((o) => o + 1)}
              disabled={atEnd}
              aria-label="Volgende maand"
            >
              <ChevronRightIcon aria-hidden="true" />
            </button>
          </div>
          <div className="portfolio-stat-value">{formatCurrency(totalForMonth)}</div>
        </div>
      </div>

      <PortfolioChart items={items} viewMode={viewMode} />

      <div className="portfolio-items">
        {(() => {
          const sorted = [...items].sort((a, b) => {
            const projA = viewMode === 'disbursed' ? a.calendarMonthDisbursement : a.calendarMonthProjection;
            const projB = viewMode === 'disbursed' ? b.calendarMonthDisbursement : b.calendarMonthProjection;
            return (projB.get(selectedMonthKey) ?? 0) - (projA.get(selectedMonthKey) ?? 0);
          });
          const inactiveCount = sorted.filter((r) => itemStatusForMonth(r, selectedMonthKey) !== 'active').length;
          const visible = showInactive ? sorted : sorted.filter((r) => itemStatusForMonth(r, selectedMonthKey) === 'active');
          return (<>
        {visible.map((r) => {
          const status = itemStatusForMonth(r, selectedMonthKey);
          const isExpanded = expandedId === r.id;
          const days = isExpanded && viewMode === 'accrued' ? getMonthDays(r, selectedMonthKey) : [];
          const disbursedAmount = r.calendarMonthDisbursement.get(selectedMonthKey) ?? 0;
          return (
          <div key={r.id} className={`portfolio-entry${status === 'expired' ? ' portfolio-item--expired' : ''}${status === 'upcoming' ? ' portfolio-item--upcoming' : ''}`}>
            <div
              className="portfolio-item"
              role="button"
              tabIndex={0}
              onClick={() => setExpandedId(isExpanded ? null : r.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedId(isExpanded ? null : r.id); } }}
              aria-expanded={isExpanded}
            >
              <div className="portfolio-item-info">
                <span className="portfolio-item-label">
                  {r.label}
                  <span className="badge-interval">{INTERVAL_LABELS[r.interval]}</span>
                  {status === 'expired' && <span className="badge-expired">Verlopen</span>}
                  {status === 'upcoming' && <span className="badge-upcoming">Toekomstig</span>}
                </span>
              </div>
              <div className="portfolio-item-amount">
                {formatCurrency(
                  viewMode === 'disbursed'
                    ? (r.calendarMonthDisbursement.get(selectedMonthKey) ?? 0)
                    : (r.calendarMonthProjection.get(selectedMonthKey) ?? 0)
                )}
              </div>
              <span className={`portfolio-item-chevron${isExpanded ? ' portfolio-item-chevron--open' : ''}`}>
                <ChevronDownIcon aria-hidden="true" />
              </span>
              <button
                className="btn-icon"
                title="Verwijder uit portefeuille"
                onClick={(e) => { e.stopPropagation(); onToggle(r.id); }}
                aria-label="Verwijder uit portefeuille"
              >
                <XMarkIcon aria-hidden="true" />
              </button>
            </div>
            {isExpanded && (
              <div className="portfolio-breakdown">
                {viewMode === 'disbursed' ? (
                  disbursedAmount > 0
                    ? <p className="portfolio-breakdown__payout">Uitbetaling: {formatCurrency(disbursedAmount)}</p>
                    : <p className="portfolio-breakdown__empty">Geen uitbetaling deze maand</p>
                ) : days.length > 0 ? (
                  <table className="portfolio-breakdown__table">
                    <thead>
                      <tr>
                        <th>Dag</th>
                        <th>Saldo</th>
                        <th>Rente %</th>
                        <th>Dagrente</th>
                        <th>Opgebouwd</th>
                      </tr>
                    </thead>
                    <tbody>
                      {days.map((day) => (
                        <tr key={day.date}>
                          <td>{parseDate(day.date).getDate()}</td>
                          <td>{formatCurrency(day.balance)}</td>
                          <td>{day.rate}%</td>
                          <td>{formatCurrency(day.dayInterest)}</td>
                          <td>{formatCurrency(day.cumulative)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3}>Totaal</td>
                        <td>{formatCurrency(days[days.length - 1].cumulative)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <p className="portfolio-breakdown__empty">Geen rente in deze maand</p>
                )}
              </div>
            )}
          </div>
          );
        })}
        {inactiveCount > 0 && (
          <label className="portfolio-inactive-toggle">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            Toon verlopen en toekomstige rekeningen ({inactiveCount})
          </label>
        )}
          </>);
        })()}
      </div>
    </section>
  );
}
