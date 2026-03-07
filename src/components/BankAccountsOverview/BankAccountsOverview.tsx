import { Fragment, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { InformationCircleIcon, PlusIcon, ChevronDownIcon, PencilIcon, XMarkIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import type { BankAccount } from '../../models/BankAccount';
import type { CashFlow } from '../../models/CashFlow';
import type { RateChange } from '../../models/RateChange';
import { PayoutInterval, INTERVAL_LABELS } from '../../enums/PayoutInterval';
import { InterestType, INTEREST_TYPE_LABELS } from '../../enums/InterestType';
import { formatCurrency, formatDurationShort, formatDate } from '../../utils/format';
import CashFlowEditor from '../CashFlowEditor';
import RateChangeEditor from '../RateChangeEditor';
import { useModal } from '../../context/ModalContext';
import './BankAccountsOverview.css';

interface BankAccountsOverviewProps {
  results: BankAccount[];
  onRemove: (id: string) => void;
  onClear: () => void;
  portfolioIds: Set<string>;
  onTogglePortfolio: (id: string) => void;
  onEdit: (result: BankAccount) => void;
  onNewAccount: () => void;
  onUpdateCashFlows: (id: string, cashFlows: CashFlow[]) => void;
  onUpdateRateChanges: (id: string, rateChanges: RateChange[]) => void;
  onExport: () => void;
  onImportFile: (file: File) => Promise<void>;
  importError: string | null;
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

export default function BankAccountsOverview({ results, onRemove, onClear, portfolioIds, onTogglePortfolio, onEdit, onNewAccount, onUpdateCashFlows, onUpdateRateChanges, onExport, onImportFile, importError }: BankAccountsOverviewProps) {
  const { t } = useTranslation();
  const [openId, setOpenId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { openModal } = useModal();

  function handleRemove(id: string) {
    openModal({
      type: 'confirm',
      title: t('accounts.confirmDeleteTitle'),
      message: t('accounts.confirmDeleteMessage'),
      confirmLabel: t('accounts.confirmDeleteButton'),
      onConfirm: () => onRemove(id),
    });
  }

  function handleClear() {
    openModal({
      type: 'confirm',
      title: t('accounts.confirmClearTitle'),
      message: t('accounts.confirmClearMessage'),
      confirmLabel: t('accounts.clearAll'),
      onConfirm: onClear,
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
      e.target.value = '';
    }
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
          <button className="btn-secondary empty-state__btn" onClick={() => fileInputRef.current?.click()}>
            {t('accounts.import')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="sr-only"
            onChange={handleFileChange}
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
        {importError && (
          <p className="data-transfer__error" role="alert">{importError}</p>
        )}
      </section>
    );
  }

  const sorted = [...results].sort((a, b) => {
    if (!a.endDate && !b.endDate) return 0;
    if (!a.endDate) return 1;
    if (!b.endDate) return -1;
    return a.endDate.localeCompare(b.endDate);
  });


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
          <button className="btn-action btn-action--muted" onClick={onExport} aria-label={t('accounts.export')}>
            {t('accounts.export')}
          </button>
          <button className="btn-action btn-action--muted" onClick={() => fileInputRef.current?.click()} aria-label={t('accounts.import')}>
            {t('accounts.import')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="sr-only"
            onChange={handleFileChange}
            aria-hidden="true"
            tabIndex={-1}
          />
          <button className="btn-action btn-action--danger" onClick={handleClear}>
            {t('accounts.clearAll')}
          </button>
        </div>
      </div>
      {importError && (
        <p className="data-transfer__error" role="alert">{importError}</p>
      )}

      <div className="comparison-table-wrapper-inner">
          <table className="comparison-table">
          <thead>
            <tr>
              <th></th>
              <th><ColumnInfo label={t('accounts.balance')} info={t('accounts.balanceInfo')} /></th>
              <th>{t('accounts.interest')}</th>
              <th>{t('accounts.endDate')}</th>
              <th>{t('accounts.payout')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const isOpen = openId === r.id;
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
                      {formatCurrency(r.interestType === InterestType.Compound ? r.currentBalance + r.disbursedToDate : r.currentBalance)}
                      {!r.isOngoing && r.totalInterest > 0 && (() => {
                        const pct = Math.round((r.disbursedToDate + r.accruedInterest) / r.totalInterest * 100);
                        if (pct >= 100) return <span className="comparison-badge comparison-badge--complete">{pct}%</span>;
                        return <span className="comparison-badge comparison-badge--progress">{pct}%</span>;
                      })()}
                    </td>
                    <td>{r.annualInterestRate}%</td>
                    <td>
                      {r.isOngoing
                        ? <span className="comparison-badge comparison-badge--ongoing">{t('accounts.ongoing')}</span>
                        : <>
                            {r.endDate && formatDate(r.endDate)}{' '}
                            <span className="comparison-badge">{formatDurationShort(r.durationMonths)}</span>
                            {r.totalInterest > 0 && Math.round((r.disbursedToDate + r.accruedInterest) / r.totalInterest * 100) >= 100 && (
                              <span className="comparison-badge comparison-badge--complete">{t('accounts.completed')}</span>
                            )}
                          </>
                      }
                    </td>
                    <td>
                      {INTERVAL_LABELS[r.interval]} <span className="comparison-badge">{INTEREST_TYPE_LABELS[r.interestType]}</span>
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
                      <td colSpan={6}>
                        {(r.disbursedToDate > 0 || r.accruedInterest > 0 || r.nextPayoutDate) && (
                          <div className="period-detail-status">
                            {r.disbursedToDate > 0 && (
                              <span className="period-detail-status__item">
                                <strong><ColumnInfo label={t('accounts.disbursed')} info={t('accounts.disbursedInfo')} /></strong> {formatCurrency(r.disbursedToDate)}
                              </span>
                            )}
                            {r.accruedInterest > 0 && (
                              <span className="period-detail-status__item">
                                <strong><ColumnInfo label={t('accounts.accrued')} info={t('accounts.accruedInfo')} /></strong> {formatCurrency(r.accruedInterest)}
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
                                    <td>{formatCurrency(p.startBalance)}</td>
                                    {r.totalDeposited !== 0 && (
                                      <td className={p.deposited > 0 ? 'text-success' : p.deposited < 0 ? 'text-danger' : ''}>
                                        {p.deposited !== 0 ? formatCurrency(p.deposited) : '—'}
                                      </td>
                                    )}
                                    <td>{formatCurrency(p.interestEarned)}</td>
                                    <td>{formatCurrency(p.disbursed)}</td>
                                    <td>{formatCurrency(idx === r.periods.length - 1 && r.interval === PayoutInterval.AtMaturity ? r.endAmount : p.endBalance)}</td>
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
                                <dd>{formatCurrency(r.currentBalance)}</dd>
                              </div>
                              <div className="period-summary__item">
                                <dt>{t('accounts.totalInterest')}</dt>
                                <dd className="period-summary__highlight">{formatCurrency(r.totalInterest)}</dd>
                              </div>
                              <div className="period-summary__item">
                                <dt>{t('accounts.endAmount')}</dt>
                                <dd>{formatCurrency(r.endAmount)}</dd>
                              </div>
                              {r.interestThisMonth > 0 && (
                                <div className="period-summary__item">
                                  <dt>{t('accounts.interestThisMonth')}</dt>
                                  <dd>{formatCurrency(r.interestThisMonth)}</dd>
                                </div>
                              )}
                            </dl>
                          </aside>
                        </div>
                        <div className="period-editors">
                          <CashFlowEditor
                            cashFlows={r.cashFlows}
                            onUpdate={(cfs) => onUpdateCashFlows(r.id, cfs)}
                          />
                          {r.isVariableRate && (
                            <RateChangeEditor
                              rateChanges={r.rateChanges}
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
