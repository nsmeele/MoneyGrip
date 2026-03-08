import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, ChevronDownIcon, StarIcon } from '@heroicons/react/24/outline';
import type { BankAccount } from '../../models/BankAccount';
import { getIntervalLabel } from '../../enums/PayoutInterval';
import { formatCurrency, formatAccountLabel, formatRate } from '../../utils/format';
import { useLocale } from '../../context/useLocale';
import type { Currency } from '../../enums/Currency';
import { toMonthKey, addMonthsToISO, todayISO, getNextMonthStart, endOfMonthISO, parseDate } from '../../utils/date';
import { getMonthDays } from '../../utils/monthDays';
import MonthNav from '../MonthNav';
import PortfolioChart from '../PortfolioChart';
import './PortfolioSummary.css';

import { itemStatusForMonth } from '../../utils/portfolioStatus';

interface PortfolioSummaryProps {
  results: BankAccount[];
  portfolioIds: Set<string>;
  onToggle: (id: string) => void;
}

export default function PortfolioSummary({ results, portfolioIds, onToggle }: PortfolioSummaryProps) {
  const { t } = useTranslation();
  const { currency: globalCurrency } = useLocale();
  const items = results.filter((r) => portfolioIds.has(r.id));
  const hasMixedCurrencies = new Set(items.map((r) => r.currency ?? globalCurrency)).size > 1;
  const currentMonthKey = toMonthKey(todayISO());
  const [monthOffset, setMonthOffset] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'accrued' | 'disbursed'>('accrued');
  const [showInactive, setShowInactive] = useState(false);
  const [showZeroInterest, setShowZeroInterest] = useState(false);

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

      <MonthNav
        selectedMonthKey={selectedMonthKey}
        isCurrentMonth={isCurrentMonth}
        disablePrev={atStart}
        disableNext={atEnd}
        onPrev={() => setMonthOffset((o) => o - 1)}
        onNext={() => setMonthOffset((o) => o + 1)}
        onReset={() => setMonthOffset(0)}
      />

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
          const afterInactive = showInactive ? sorted : sorted.filter((r) => itemStatusForMonth(r, selectedMonthKey) === 'active');
          const visible = showZeroInterest ? afterInactive : afterInactive.filter((r) => {
            const projection = viewMode === 'disbursed' ? r.calendarMonthDisbursement : r.calendarMonthProjection;
            return Math.round((projection.get(selectedMonthKey) ?? 0) * 100) !== 0;
          });
          return (<>
        {visible.map((r) => {
          const status = itemStatusForMonth(r, selectedMonthKey);
          const isExpanded = expandedId === r.id;
          const cur = (r.currency as Currency | undefined) ?? globalCurrency;
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
                  {formatAccountLabel(r.effectiveBalance, r.annualInterestRate, cur)}
                  <span className="badge-interval">{getIntervalLabel(r.interval)}</span>
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
                          <td>{formatRate(day.rate, cur)}%</td>
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
          <input type="checkbox" id="showZeroInterest" checked={showZeroInterest} onChange={(e) => setShowZeroInterest(e.target.checked)} />
          <label htmlFor="showZeroInterest">{t('portfolio.showZeroInterest')}</label>
        </div>
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
