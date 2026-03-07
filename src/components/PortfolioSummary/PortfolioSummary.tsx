import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, StarIcon } from '@heroicons/react/24/outline';
import type { BankAccount } from '../../models/BankAccount';
import { expandCashFlows } from '../../models/CashFlow';
import { INTERVAL_LABELS } from '../../enums/PayoutInterval';
import { formatCurrency } from '../../utils/format';
import { useCurrency } from '../../hooks/useCurrency';
import { toMonthKey, addMonthsToISO, todayISO, toISO, getNextMonthStart, endOfMonthISO, parseDate } from '../../utils/date';
import { yearFraction } from '../../utils/dayCount';
import { getRateForDate } from '../../utils/rateChange';
import { LOCALE_MAP } from '../../i18n';
import type { SupportedLanguage } from '../../i18n';
import PortfolioChart from '../PortfolioChart';
import './PortfolioSummary.css';

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

  const dayMap = new Map<string, { balance: number; rate: number }>();

  for (let i = 0; i < account.periods.length; i++) {
    const period = account.periods[i];
    const periodStart = i === 0 ? account.startDate : account.periods[i - 1].endDate!;
    const periodEnd = period.endDate;
    if (!periodEnd) continue;
    if (periodEnd <= monthStart || periodStart >= monthEnd) continue;

    let balance = period.startBalance;

    for (const cf of allCashFlows) {
      if (cf.date >= periodStart && cf.date < monthStart) {
        balance = Math.max(0, balance + Math.max(-balance, cf.amount));
      }
    }

    const sliceStart = periodStart > monthStart ? periodStart : monthStart;
    const sliceEnd = periodEnd < monthEnd ? periodEnd : monthEnd;

    let day = sliceStart;
    while (day < sliceEnd) {
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

  const rows: DayRow[] = [];
  let cumulative = 0;

  let cursor = monthStart;
  while (cursor < monthEnd) {
    const entry = dayMap.get(cursor);
    if (entry) {
      const nextDay = addDay(cursor);
      const dayInterest = entry.balance * (entry.rate / 100) * yearFraction(cursor, nextDay, account.dayCount);
      rows.push({ date: cursor, balance: entry.balance, rate: entry.rate, dayInterest, cumulative });
      cumulative += dayInterest;
    }
    cursor = addDay(cursor);
  }

  return rows;
}

interface PortfolioSummaryProps {
  results: BankAccount[];
  portfolioIds: Set<string>;
  onToggle: (id: string) => void;
}

export default function PortfolioSummary({ results, portfolioIds, onToggle }: PortfolioSummaryProps) {
  const { t, i18n } = useTranslation();
  const { currency: globalCurrency } = useCurrency();
  const items = results.filter((r) => portfolioIds.has(r.id));
  const hasMixedCurrencies = new Set(items.map((r) => r.currency ?? globalCurrency)).size > 1;
  const currentMonthKey = toMonthKey(todayISO());
  const [monthOffset, setMonthOffset] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'accrued' | 'disbursed'>('accrued');
  const [showInactive, setShowInactive] = useState(false);

  const locale = LOCALE_MAP[i18n.language as SupportedLanguage] ?? 'nl-NL';

  function formatMonthLabel(monthKey: string): string {
    const [year, month] = monthKey.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(d);
  }

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

  if (items.length === 0) {
    return (
      <section className="portfolio-section" aria-label={t('portfolio.title')}>
        <div className="section-header">
          <div className="section-header__title">
            <h2>{t('portfolio.title')}</h2>
          </div>
        </div>
        <div className="portfolio-empty">
          <StarIcon className="portfolio-empty__icon" aria-hidden="true" />
          <p>{t('portfolio.emptyHint')}</p>
        </div>
      </section>
    );
  }

  const atStart = monthBounds.min !== '' && selectedMonthKey <= monthBounds.min;
  const atEnd = monthBounds.max !== '' && selectedMonthKey >= monthBounds.max;

  const totalForMonth = items.reduce((sum, r) => {
    const projection = viewMode === 'disbursed' ? r.calendarMonthDisbursement : r.calendarMonthProjection;
    return sum + (projection.get(selectedMonthKey) ?? 0);
  }, 0);

  const monthEnd = getNextMonthStart(`${selectedMonthKey}-01`);

  const activeForMonth = items.filter((r) => itemStatusForMonth(r, selectedMonthKey) === 'active');

  const lastDayOfMonth = endOfMonthISO(`${selectedMonthKey}-01`);
  const activeAtMonthEnd = activeForMonth.filter((r) => {
    const lastPayout = r.periods[r.periods.length - 1]?.endDate;
    return r.isOngoing || !lastPayout || lastPayout >= lastDayOfMonth;
  });

  const totalInvested = activeAtMonthEnd.reduce((sum, r) => {
    const deposited = r.periods
      .filter((p) => p.endDate && p.endDate <= monthEnd)
      .reduce((s, p) => s + (p.deposited ?? 0), 0);
    return sum + r.startAmount + deposited;
  }, 0);

  const isCurrentMonth = monthOffset === 0;

  return (
    <section className="portfolio-section" aria-label={t('portfolio.title')}>
      <div className="section-header">
        <div className="section-header__title">
          <h2>
            {t('portfolio.title')}
            <span className="results-count">{items.length}</span>
          </h2>
        </div>
      </div>

      <div className="month-nav">
        <button
          className="month-nav__btn"
          onClick={() => setMonthOffset((o) => o - 1)}
          disabled={atStart}
          aria-label={t('portfolio.prevMonth')}
        >
          <ChevronLeftIcon aria-hidden="true" />
        </button>
        <div className="month-nav__label">
          <span className="portfolio-stat-label">{formatMonthLabel(selectedMonthKey)}</span>
          {isCurrentMonth
            ? <span className="month-nav__current">{t('portfolio.now')}</span>
            : <button className="btn-action month-nav__reset" onClick={() => setMonthOffset(0)} aria-label={t('portfolio.backToCurrent')}>{t('portfolio.now')}</button>
          }
        </div>
        <button
          className="month-nav__btn"
          onClick={() => setMonthOffset((o) => o + 1)}
          disabled={atEnd}
          aria-label={t('portfolio.nextMonth')}
        >
          <ChevronRightIcon aria-hidden="true" />
        </button>
      </div>

      <nav className="portfolio-tabs" aria-label={t('portfolio.viewLabel')}>
        <button
          className={`portfolio-tabs__tab${viewMode === 'accrued' ? ' portfolio-tabs__tab--active' : ''}`}
          onClick={() => setViewMode('accrued')}
        >
          {t('portfolio.accrued')}
        </button>
        <button
          className={`portfolio-tabs__tab${viewMode === 'disbursed' ? ' portfolio-tabs__tab--active' : ''}`}
          onClick={() => setViewMode('disbursed')}
        >
          {t('portfolio.disbursed')}
        </button>
      </nav>

      {hasMixedCurrencies ? (
        <div className="portfolio-stats">
          <p className="portfolio-stat-mixed">{t('portfolio.mixedCurrencies')}</p>
        </div>
      ) : (
        <div className="portfolio-stats">
          <div className="portfolio-stat">
            <div className="portfolio-stat-label">{t('portfolio.totalInvested')}</div>
            <div className="portfolio-stat-value">{formatCurrency(totalInvested, globalCurrency)}</div>
          </div>
          <div className="portfolio-stat portfolio-stat--highlight">
            <div className="portfolio-stat-label">{viewMode === 'disbursed' ? t('portfolio.disbursed') : t('portfolio.interestLabel')}</div>
            <div className="portfolio-stat-value">{formatCurrency(totalForMonth, globalCurrency)}</div>
          </div>
        </div>
      )}

      <PortfolioChart items={items} viewMode={viewMode} />

      <div className="portfolio-items">
        {(() => {
          const sorted = [...items].sort((a, b) => {
            const projA = viewMode === 'disbursed' ? a.calendarMonthDisbursement : a.calendarMonthProjection;
            const projB = viewMode === 'disbursed' ? b.calendarMonthDisbursement : b.calendarMonthProjection;
            return (projB.get(selectedMonthKey) ?? 0) - (projA.get(selectedMonthKey) ?? 0);
          });
          const visible = showInactive ? sorted : sorted.filter((r) => itemStatusForMonth(r, selectedMonthKey) === 'active');
          return (<>
        {visible.map((r) => {
          const status = itemStatusForMonth(r, selectedMonthKey);
          const isExpanded = expandedId === r.id;
          const cur = r.currency ?? globalCurrency;
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
                  {status === 'expired' && <span className="badge-expired">{t('portfolio.expired')}</span>}
                  {status === 'upcoming' && <span className="badge-upcoming">{t('portfolio.upcoming')}</span>}
                </span>
              </div>
              <div className="portfolio-item-amount">
                {formatCurrency(
                  viewMode === 'disbursed'
                    ? (r.calendarMonthDisbursement.get(selectedMonthKey) ?? 0)
                    : (r.calendarMonthProjection.get(selectedMonthKey) ?? 0),
                  cur,
                )}
              </div>
              <span className={`portfolio-item-chevron${isExpanded ? ' portfolio-item-chevron--open' : ''}`}>
                <ChevronDownIcon aria-hidden="true" />
              </span>
              <button
                className="btn-icon"
                title={t('portfolio.removeFromPortfolio')}
                onClick={(e) => { e.stopPropagation(); onToggle(r.id); }}
                aria-label={t('portfolio.removeFromPortfolio')}
              >
                <XMarkIcon aria-hidden="true" />
              </button>
            </div>
            {isExpanded && (
              <div className="portfolio-breakdown">
                {viewMode === 'disbursed' ? (
                  disbursedAmount > 0
                    ? <p className="portfolio-breakdown__payout">{t('portfolio.payoutAmount', { amount: formatCurrency(disbursedAmount, cur) })}</p>
                    : <p className="portfolio-breakdown__empty">{t('portfolio.noPayoutThisMonth')}</p>
                ) : days.length > 0 ? (
                  <table className="portfolio-breakdown__table">
                    <thead>
                      <tr>
                        <th>{t('portfolio.day')}</th>
                        <th>{t('portfolio.balance')}</th>
                        <th>{t('portfolio.ratePercent')}</th>
                        <th>{t('portfolio.dailyInterest')}</th>
                        <th>{t('portfolio.cumulativeInterest')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {days.map((day) => (
                        <tr key={day.date}>
                          <td>{parseDate(day.date).getDate()}</td>
                          <td>{formatCurrency(day.balance, cur)}</td>
                          <td>{day.rate}%</td>
                          <td>{formatCurrency(day.dayInterest, cur)}</td>
                          <td>{formatCurrency(day.cumulative, cur)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="portfolio-breakdown__empty">{t('portfolio.noInterestThisMonth')}</p>
                )}
              </div>
            )}
          </div>
          );
        })}
        <div className="form-checkbox portfolio-inactive-toggle">
          <input type="checkbox" id="showInactive" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          <label htmlFor="showInactive">{t('portfolio.showInactive')}</label>
        </div>
          </>);
        })()}
      </div>
    </section>
  );
}
