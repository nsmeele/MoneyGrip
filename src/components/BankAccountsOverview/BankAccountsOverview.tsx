import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { InformationCircleIcon, PlusIcon, ChevronDownIcon, ChevronUpDownIcon, PencilIcon, XMarkIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import type { BankAccount } from '../../models/BankAccount';
import { getInterestTypeLabel } from '../../enums/InterestType';
import { getIntervalLabel } from '../../enums/PayoutInterval';
import type { Currency } from '../../enums/Currency';
import { formatCurrency, formatDurationShort, formatDate, formatRate } from '../../utils/format';
import { useLocale } from '../../context/useLocale';
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

export default function BankAccountsOverview({ results, onRemove, portfolioIds, onTogglePortfolio, onEdit, onNewAccount, onImport, onLoadDemo }: BankAccountsOverviewProps) {
  const { t } = useTranslation();
  const { currency: globalCurrency } = useLocale();
  const [sortState, setSortState] = useState<SortState>(loadSortState);
  const { openModal } = useModal();
  const navigate = useNavigate();
  const { lang } = useParams();

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
              const cur = (r.currency as Currency | undefined) ?? globalCurrency;
              return (
                <tr
                  key={r.id}
                  className="comparison-row"
                  onClick={() => navigate(`/${lang}/account/${r.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/${lang}/account/${r.id}`); } }}
                  tabIndex={0}
                  role="link"
                >
                  <td className="amount">
                    {formatCurrency(r.effectiveBalance, cur)}
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
              );
            })}
          </tbody>
        </table>
        </div>
    </section>
  );
}
