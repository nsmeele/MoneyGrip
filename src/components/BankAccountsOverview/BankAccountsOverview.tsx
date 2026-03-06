import { Fragment, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { InformationCircleIcon, PlusIcon, ChevronDownIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import type { BankAccount } from '../../models/BankAccount';
import type { CashFlow } from '../../models/CashFlow';
import type { RateChange } from '../../models/RateChange';
import { PayoutInterval, INTERVAL_LABELS } from '../../enums/PayoutInterval';
import { INTEREST_TYPE_LABELS } from '../../enums/InterestType';
import { formatCurrency, formatDurationShort, formatDate } from '../../utils/format';
import CashFlowEditor from '../CashFlowEditor';
import RateChangeEditor from '../RateChangeEditor';
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
        aria-label={`Info over ${label}`}
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
  const [openId, setOpenId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
      e.target.value = '';
    }
  }

  if (results.length === 0) {
    return (
      <section className="empty-state" aria-label="Nog geen rekeningen">
        <PlusIcon className="empty-state__icon" aria-hidden="true" />
        <h3>Nog geen rekeningen</h3>
        <p>Voeg je eerste rekening toe of importeer een eerder opgeslagen bestand.</p>
        <div className="empty-state__actions">
          <button className="btn-primary empty-state__btn" onClick={onNewAccount}>
            Nieuwe rekening
          </button>
          <button className="btn-secondary empty-state__btn" onClick={() => fileInputRef.current?.click()}>
            Importeren
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
    <section className="results-section" aria-label="Rekeningen">
      <div className="section-header">
        <div className="section-header__title">
          <h2>
            Rekeningen
            <span className="results-count">{results.length}</span>
          </h2>
        </div>
        <div className="section-header__actions">
          <button className="btn-action" onClick={onNewAccount}>
            <PlusIcon aria-hidden="true" />
            Nieuwe rekening
          </button>
          <button className="btn-action btn-action--muted" onClick={onExport} aria-label="Exporteren">
            Exporteren
          </button>
          <button className="btn-action btn-action--muted" onClick={() => fileInputRef.current?.click()} aria-label="Importeren">
            Importeren
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
          <button className="btn-action btn-action--danger" onClick={onClear}>
            Alles wissen
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
              <th><ColumnInfo label="Saldo" info="Je huidige inleg: het startbedrag plus alle stortingen en min alle opnames. Rente is hier niet in meegenomen." /></th>
              <th>Rente</th>
              <th>Van</th>
              <th>Tot</th>
              <th>Looptijd</th>
              <th>Type</th>
              <th>Uitbetaling</th>
              <th><ColumnInfo label="Uitbetaald" info="Rente die al daadwerkelijk is uitbetaald op de uitbetalingsdatums tot en met vandaag." /></th>
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
                      {formatCurrency(r.currentBalance)}
                    </td>
                    <td>{r.annualInterestRate}%</td>
                    <td>{r.startDate ? formatDate(r.startDate) : '—'}</td>
                    <td>{r.endDate ? formatDate(r.endDate) : '—'}</td>
                    <td>{r.isOngoing ? 'Lopend' : formatDurationShort(r.durationMonths)}</td>
                    <td>{INTEREST_TYPE_LABELS[r.interestType]}</td>
                    <td>{INTERVAL_LABELS[r.interval]}</td>
                    <td className="amount">
                      {formatCurrency(r.disbursedToDate)}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="comparison-actions">
                      <button
                        className="btn-icon"
                        title="Bewerken"
                        onClick={() => onEdit(r)}
                        aria-label="Bewerken"
                      >
                        <PencilIcon aria-hidden="true" />
                      </button>
                      <button
                        className={`btn-portfolio${portfolioIds.has(r.id) ? ' btn-portfolio--active' : ''}`}
                        title={portfolioIds.has(r.id) ? 'Verwijder uit portefeuille' : 'Toevoegen aan portefeuille'}
                        onClick={() => onTogglePortfolio(r.id)}
                        aria-label={portfolioIds.has(r.id) ? 'Verwijder uit portefeuille' : 'Toevoegen aan portefeuille'}
                      >
                        {portfolioIds.has(r.id) ? <StarIconSolid aria-hidden="true" /> : <StarIconOutline aria-hidden="true" />}
                      </button>
                      <button
                        className="btn-icon"
                        title="Verwijderen"
                        onClick={() => onRemove(r.id)}
                        aria-label="Verwijderen"
                      >
                        <XMarkIcon aria-hidden="true" />
                      </button>
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="period-detail-row">
                      <td colSpan={10}>
                        {(r.accruedInterest > 0 || r.nextPayoutDate) && (
                          <div className="period-detail-status">
                            {r.accruedInterest > 0 && (
                              <span className="period-detail-status__item">
                                <strong>Opgebouwd:</strong> {formatCurrency(r.accruedInterest)}
                              </span>
                            )}
                            {r.nextPayoutDate && (
                              <span className="period-detail-status__item">
                                <strong>Volgende uitbetaling:</strong> {formatDate(r.nextPayoutDate)}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="period-detail-layout">
                          <div className="period-table-wrapper">
                            <table className="period-table">
                              <thead>
                                <tr>
                                  <th>Periode</th>
                                  <th>Beginsaldo</th>
                                  {r.totalDeposited !== 0 && <th>Gestort</th>}
                                  <th>Rente</th>
                                  <th>Uitbetaald</th>
                                  <th>Eindsaldo</th>
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
                                <dt>Inleg</dt>
                                <dd>{formatCurrency(r.currentBalance)}</dd>
                              </div>
                              <div className="period-summary__item">
                                <dt>Totale rente</dt>
                                <dd className="period-summary__highlight">{formatCurrency(r.totalInterest)}</dd>
                              </div>
                              <div className="period-summary__item">
                                <dt>Eindbedrag</dt>
                                <dd>{formatCurrency(r.endAmount)}</dd>
                              </div>
                              {r.interestThisMonth > 0 && (
                                <div className="period-summary__item">
                                  <dt>Rente deze maand</dt>
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
