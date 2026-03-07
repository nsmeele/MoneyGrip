import { Fragment, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { InformationCircleIcon, PlusIcon, ChevronDownIcon, ChevronUpDownIcon, PencilIcon, XMarkIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import type { BankAccount } from '../../models/BankAccount';
import type { CashFlow } from '../../models/CashFlow';
import type { RateChange } from '../../models/RateChange';
import { PayoutInterval, getIntervalLabel } from '../../enums/PayoutInterval';
import { InterestType, getInterestTypeLabel } from '../../enums/InterestType';
import { formatCurrency, formatDurationShort, formatDate, formatRate } from '../../utils/format';
import { useCurrency } from '../../hooks/useCurrency';
import CashFlowEditor from '../CashFlowEditor';
import RateChangeEditor from '../RateChangeEditor';
import { useModal } from '../../context/useModal';
import { sortAccounts, type SortColumn, type SortState } from './sortAccounts';
import './BankAccountsOverview.css';

const SORT_STORAGE_KEY = 'bank-account-sort';

function loadSortState(): SortState {
  try {
    const raw = localStorage.getItem(SORT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && ['balance', 'endDate'].includes(parsed.column) && ['asc', 'desc'].includes(parsed.direction)) {
      return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

function saveSortState(state: SortState) {
  if (state) {
    localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(state));
  } else {
    localStorage.removeItem(SORT_STORAGE_KEY);
  }
}

interface BankAccountsOverviewProps {
  results: BankAccount[];
  onRemove: (id: string) => void;
  portfolioIds: Set<string>;
  onTogglePortfolio: (id: string) => void;
  onEdit: (result: BankAccount) => void;
  onNewAccount: () => void;
  onUpdateCashFlows: (id: string, cashFlows: CashFlow[]) => void;
  onUpdateRateChanges: (id: string, rateChanges: RateChange[]) => void;
  onImport: () => void;
  onLoadDemo?: () => void;
}

function ColumnInfo({ label, info }: { label: string; info: string }) {
  const { t } = useTranslation();
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const show = useCallback((e: React.MouseEvent | React.FocusEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
  }, []);

  const hide = useCallback(() => setPos(null), []);

  return (
    <>
      {label}
      <span
        className="popover-anchor popover-anchor--th"
        tabIndex={0}
        role="button"
        aria-label={t('accounts.infoAbout', { label })}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <InformationCircleIcon className="popover-anchor__icon" aria-hidden="true" />
      </span>
      {pos && createPortal(
        <span
          className="column-info__popover"
          style={{ top: pos.top, left: pos.left }}
        >
          {info}
        </span>,
        document.body,
      )}
    </>
  );
}

function SortIndicator({ column, sortState }: { column: SortColumn; sortState: SortState }) {
  if (sortState?.column !== column) {
    return <ChevronUpDownIcon className="sort-indicator sort-indicator--inactive" aria-hidden="true" />;
  }
  return (
    <ChevronDownIcon
      className={`sort-indicator${sortState.direction === 'asc' ? ' sort-indicator--asc' : ''}`}
      aria-hidden="true"
    />
  );
}

export default function BankAccountsOverview({ results, onRemove, portfolioIds, onTogglePortfolio, onEdit, onNewAccount, onUpdateCashFlows, onUpdateRateChanges, onImport, onLoadDemo }: BankAccountsOverviewProps) {
  const { t } = useTranslation();
  const { currency: globalCurrency } = useCurrency();
  const [openId, setOpenId] = useState<string | null>(null);
  const [sortState, setSortState] = useState<SortState>(loadSortState);
  const { openModal } = useModal();

  function toggleSort(column: SortColumn) {
    setSortState(prev => {
      let next: SortState;
      if (prev?.column === column) {
        next = prev.direction === 'asc' ? { column, direction: 'desc' } : null;
      } else {
        next = { column, direction: 'asc' };
      }
      saveSortState(next);
      return next;
    });
  }

  function handleRemove(id: string) {
    openModal({
      type: 'confirm',
      title: t('accounts.confirmDeleteTitle'),
      message: t('accounts.confirmDeleteMessage'),
      confirmLabel: t('accounts.confirmDeleteButton'),
      onConfirm: () => onRemove(id),
    });
  }

  if (results.length === 0) {
    return (
      <section className="empty-state" aria-label={t('accounts.ariaLabelEmpty')}>
        <PlusIcon className="empty-state__icon" aria-hidden="true" />
        <h3>{t('accounts.emptyTitle')}</h3>
        <p>{t('accounts.emptyDescription')}</p>
        <div className="empty-state__actions">
          <button className="btn-primary empty-state__btn" onClick={onNewAccount}>
            {t('accounts.newAccount')}
          </button>
          <button className="btn-secondary empty-state__btn" onClick={onImport}>
            {t('accounts.import')}
          </button>
          {onLoadDemo && (
            <button className="btn-secondary empty-state__btn" onClick={onLoadDemo}>
              {t('accounts.loadDemo')}
            </button>
          )}
        </div>
      </section>
    );
  }

  const sorted = sortAccounts(results, sortState);


  return (
    <section className="results-section" aria-label={t('accounts.sectionLabel')}>
      <div className="section-header">
        <div className="section-header__title">
          <h2>
            {t('accounts.sectionLabel')}
            <span className="results-count">{results.length}</span>
          </h2>
        </div>
        <div className="section-header__actions">
          <button className="btn-action" onClick={onNewAccount}>
            <PlusIcon aria-hidden="true" />
            {t('accounts.newAccount')}
          </button>
        </div>
      </div>
      <div className="comparison-table-wrapper-inner">
          <table className="comparison-table">
          <thead>
            <tr>
              <th></th>
              <th
                className="comparison-table__th--sortable"
                onClick={() => toggleSort('balance')}
                aria-sort={sortState?.column === 'balance' ? (sortState.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                aria-label={t('accounts.sortBy', { column: t('accounts.balance') })}
              >
                <ColumnInfo label={t('accounts.balance')} info={t('accounts.balanceInfo')} />
                <span className="comparison-table__th-separator">@</span>
                {t('accounts.interest')}
                <SortIndicator column="balance" sortState={sortState} />
              </th>
              <th
                className="comparison-table__th--sortable"
                onClick={() => toggleSort('endDate')}
                aria-sort={sortState?.column === 'endDate' ? (sortState.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                aria-label={t('accounts.sortBy', { column: t('accounts.endDate') })}
              >
                {t('accounts.endDate')}
                <SortIndicator column="endDate" sortState={sortState} />
              </th>
              <th>{t('accounts.payout')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const isOpen = openId === r.id;
              const cur = r.currency ?? globalCurrency;
              return (
                <Fragment key={r.id}>
                  <tr
                    className="comparison-row"
                    onClick={() => setOpenId(isOpen ? null : r.id)}
                  >
                    <td>
                      <ChevronDownIcon className={`comparison-chevron${isOpen ? ' comparison-chevron--open' : ''}`} aria-hidden="true" />
                    </td>
                    <td className="amount">
                      {formatCurrency(r.interestType === InterestType.Compound ? r.currentBalance + r.disbursedToDate : r.currentBalance, cur)}
                      <span className="comparison-rate">@ {formatRate(r.annualInterestRate, cur)}%</span>
                    </td>
                    <td>
                      {r.isOngoing
                        ? <span className="comparison-badge comparison-badge--ongoing">{t('accounts.ongoing')}</span>
                        : <>
                            {r.endDate && formatDate(r.endDate)}{' '}
                            <span className="comparison-badge">{formatDurationShort(r.durationMonths)}</span>
                            {r.hasExpired && (
                              <span className="comparison-badge comparison-badge--complete">{t('accounts.completed')}</span>
                            )}
                          </>
                      }
                    </td>
                    <td>
                      {getIntervalLabel(r.interval)} <span className="comparison-badge">{getInterestTypeLabel(r.interestType)}</span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="comparison-actions">
                      <button
                        className="btn-icon"
                        title={t('accounts.edit')}
                        onClick={() => onEdit(r)}
                        aria-label={t('accounts.edit')}
                      >
                        <PencilIcon aria-hidden="true" />
                      </button>
                      <button
                        className={`btn-portfolio${portfolioIds.has(r.id) ? ' btn-portfolio--active' : ''}`}
                        title={portfolioIds.has(r.id) ? t('accounts.removeFromPortfolio') : t('accounts.addToPortfolio')}
                        onClick={() => onTogglePortfolio(r.id)}
                        aria-label={portfolioIds.has(r.id) ? t('accounts.removeFromPortfolio') : t('accounts.addToPortfolio')}
                      >
                        {portfolioIds.has(r.id) ? <StarIconSolid aria-hidden="true" /> : <StarIconOutline aria-hidden="true" />}
                      </button>
                      {import.meta.env.DEV && (
                        <button
                          className="btn-icon"
                          title={t('accounts.copyData')}
                          onClick={() => navigator.clipboard.writeText(JSON.stringify(r, null, 2))}
                          aria-label={t('accounts.copyData')}
                        >
                          <ClipboardDocumentIcon aria-hidden="true" />
                        </button>
                      )}
                      <button
                        className="btn-icon"
                        title={t('accounts.delete')}
                        onClick={() => handleRemove(r.id)}
                        aria-label={t('accounts.delete')}
                      >
                        <XMarkIcon aria-hidden="true" />
                      </button>
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="period-detail-row">
                      <td colSpan={5}>
                        {(r.disbursedToDate > 0 || r.accruedInterest > 0 || r.nextPayoutDate) && (
                          <div className="period-detail-status">
                            {r.disbursedToDate > 0 && (
                              <span className="period-detail-status__item">
                                <strong><ColumnInfo label={t('accounts.disbursed')} info={t('accounts.disbursedInfo')} /></strong> {formatCurrency(r.disbursedToDate, cur)}
                              </span>
                            )}
                            {r.accruedInterest > 0 && (
                              <span className="period-detail-status__item">
                                <strong><ColumnInfo label={t('accounts.accrued')} info={t('accounts.accruedInfo')} /></strong> {formatCurrency(r.accruedInterest, cur)}
                              </span>
                            )}
                            {r.nextPayoutDate && (
                              <span className="period-detail-status__item">
                                <strong>{t('accounts.nextPayout')}</strong> {formatDate(r.nextPayoutDate)}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="period-detail-layout">
                          <div className="period-table-wrapper">
                            <table className="period-table">
                              <thead>
                                <tr>
                                  <th>{t('accounts.period')}</th>
                                  <th>{t('accounts.startBalance')}</th>
                                  {r.totalDeposited !== 0 && <th>{t('accounts.deposited')}</th>}
                                  <th>{t('accounts.interest')}</th>
                                  <th>{t('accounts.disbursed')}</th>
                                  <th>{t('accounts.endBalance')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {r.periods.map((p, idx) => {
                                  const periodStart = idx === 0 ? r.startDate : r.periods[idx - 1].endDate;
                                  return (
                                  <tr key={p.period}>
                                    <td>
                                      {p.periodLabel}
                                      {periodStart && p.endDate && (
                                        <span className="period-table__date">{formatDate(periodStart)} – {formatDate(p.endDate)}</span>
                                      )}
                                    </td>
                                    <td>{formatCurrency(p.startBalance, cur)}</td>
                                    {r.totalDeposited !== 0 && (
                                      <td className={p.deposited > 0 ? 'text-success' : p.deposited < 0 ? 'text-danger' : ''}>
                                        {p.deposited !== 0 ? formatCurrency(p.deposited, cur) : '—'}
                                      </td>
                                    )}
                                    <td>{formatCurrency(p.interestEarned, cur)}</td>
                                    <td>{formatCurrency(p.disbursed, cur)}</td>
                                    <td>{formatCurrency(idx === r.periods.length - 1 && r.interval === PayoutInterval.AtMaturity ? r.endAmount : p.endBalance, cur)}</td>
                                  </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          <aside className="period-summary">
                            <dl className="period-summary__list">
                              <div className="period-summary__item">
                                <dt>{t('accounts.deposit')}</dt>
                                <dd>{formatCurrency(r.startAmount, cur)}</dd>
                              </div>
                              <div className="period-summary__item">
                                <dt>{t('accounts.totalInterest')}</dt>
                                <dd className="period-summary__highlight">{formatCurrency(r.totalInterest, cur)}</dd>
                              </div>
                              <div className="period-summary__item">
                                <dt>{t('accounts.endAmount')}</dt>
                                <dd>{formatCurrency(r.endAmount, cur)}</dd>
                              </div>
                              {r.interestThisMonth > 0 && (
                                <div className="period-summary__item">
                                  <dt>{t('accounts.interestThisMonth')}</dt>
                                  <dd>{formatCurrency(r.interestThisMonth, cur)}</dd>
                                </div>
                              )}
                            </dl>
                          </aside>
                        </div>
                        <div className="period-editors">
                          <CashFlowEditor
                            cashFlows={r.cashFlows}
                            onUpdate={(cfs) => onUpdateCashFlows(r.id, cfs)}
                            currency={cur}
                          />
                          {r.isVariableRate && (
                            <RateChangeEditor
                              rateChanges={r.rateChanges}
                              currency={cur}
                              onUpdate={(rcs) => onUpdateRateChanges(r.id, rcs)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        </div>
    </section>
  );
}
