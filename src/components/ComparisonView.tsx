import { Fragment, useState, useRef } from 'react';
import type { BankAccount } from '../models/BankAccount';
import type { CashFlow } from '../models/CashFlow';
import { INTERVAL_LABELS } from '../enums/PayoutInterval';
import { INTEREST_TYPE_LABELS } from '../enums/InterestType';
import { formatCurrency, formatDurationShort, formatDate } from '../utils/format';
import CashFlowEditor from './CashFlowEditor';

interface ComparisonViewProps {
  results: BankAccount[];
  onRemove: (id: string) => void;
  onClear: () => void;
  portfolioIds: Set<string>;
  onTogglePortfolio: (id: string) => void;
  onEdit: (result: BankAccount) => void;
  onUpdateCashFlows: (id: string, cashFlows: CashFlow[]) => void;
  onExport: () => void;
  onImportFile: (file: File) => Promise<void>;
  importError: string | null;
}

export default function ComparisonView({ results, onRemove, onClear, portfolioIds, onTogglePortfolio, onEdit, onUpdateCashFlows, onExport, onImportFile, importError }: ComparisonViewProps) {
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
      <div className="empty-state">
        <div className="empty-state-icon">+</div>
        <h3>Nog geen rekeningen</h3>
        <p>Maak je eerste rekening aan via het formulier. Je kunt meerdere rekeningen naast elkaar vergelijken.</p>
      </div>
    );
  }

  const sorted = [...results].sort((a, b) => {
    if (!a.endDate && !b.endDate) return 0;
    if (!a.endDate) return 1;
    if (!b.endDate) return -1;
    return a.endDate.localeCompare(b.endDate);
  });

  const bestInterestId = results.length >= 2
    ? results.reduce((best, r) => r.totalInterest > best.totalInterest ? r : best).id
    : null;

  return (
    <div className="results-section">
      <div className="card">
        <div className="card-header">
          <div className="results-header">
            <div>
              <h2>
                Overzicht
                <span className="results-count">{results.length}</span>
              </h2>
            </div>
            <div className="results-header__actions">
              <button className="btn-transfer" onClick={onExport} aria-label="Exporteren">
                Exporteren
              </button>
              <button className="btn-transfer" onClick={() => fileInputRef.current?.click()} aria-label="Importeren">
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
              <button className="btn-danger" onClick={onClear}>
                Alles wissen
              </button>
            </div>
          </div>
          {importError && (
            <p className="data-transfer__error" role="alert">{importError}</p>
          )}
        </div>

        <div className="comparison-table-wrapper-inner">
          <table className="comparison-table">
          <thead>
            <tr>
              <th></th>
              <th>Rente</th>
              <th>Type</th>
              <th>Uitbetaling</th>
              <th>Looptijd</th>
              <th>Van</th>
              <th>Tot</th>
              <th>Saldo</th>
              <th>Rente-opbrengst</th>
              <th>Totaal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const isOpen = openId === r.id;
              const isBest = r.id === bestInterestId;

              return (
                <Fragment key={r.id}>
                  <tr
                    className={`comparison-row${isBest ? ' highlight-best-bg' : ''}`}
                    onClick={() => setOpenId(isOpen ? null : r.id)}
                  >
                    <td>
                      <span className={`comparison-chevron${isOpen ? ' comparison-chevron--open' : ''}`}>
                        &#9660;
                      </span>
                    </td>
                    <td>{r.annualInterestRate}%</td>
                    <td>{INTEREST_TYPE_LABELS[r.interestType]}</td>
                    <td>{INTERVAL_LABELS[r.interval]}</td>
                    <td>{r.isOngoing ? 'Lopend' : formatDurationShort(r.durationMonths)}</td>
                    <td>{r.startDate ? formatDate(r.startDate) : '—'}</td>
                    <td>{r.endDate ? formatDate(r.endDate) : '—'}</td>
                    <td className="amount">
                      {formatCurrency(r.currentBalance)}
                    </td>
                    <td className={`amount${isBest ? ' highlight-best' : ''}`}>
                      {formatCurrency(r.totalInterest)}
                      {r.nextPayoutDate && (
                        <span className="next-payout">{formatDate(r.nextPayoutDate)}</span>
                      )}
                    </td>
                    <td className="amount">{formatCurrency(r.endAmount)}</td>
                    <td className="comparison-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn-icon"
                        title="Bewerken"
                        onClick={() => onEdit(r)}
                        aria-label="Bewerken"
                      >
                        &#9998;
                      </button>
                      <button
                        className={`btn-portfolio${portfolioIds.has(r.id) ? ' btn-portfolio--active' : ''}`}
                        title={portfolioIds.has(r.id) ? 'Verwijder uit portefeuille' : 'Toevoegen aan portefeuille'}
                        onClick={() => onTogglePortfolio(r.id)}
                        aria-label={portfolioIds.has(r.id) ? 'Verwijder uit portefeuille' : 'Toevoegen aan portefeuille'}
                      >
                        {portfolioIds.has(r.id) ? '\u2605' : '\u2606'}
                      </button>
                      <button
                        className="btn-icon"
                        title="Verwijderen"
                        onClick={() => onRemove(r.id)}
                        aria-label="Verwijderen"
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="period-detail-row">
                      <td colSpan={11}>
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
                              {r.periods.map((p) => (
                                <tr key={p.period}>
                                  <td>{p.periodLabel}</td>
                                  <td>{formatCurrency(p.startBalance)}</td>
                                  {r.totalDeposited !== 0 && (
                                    <td className={p.deposited > 0 ? 'text-success' : p.deposited < 0 ? 'text-danger' : ''}>
                                      {p.deposited !== 0 ? formatCurrency(p.deposited) : '—'}
                                    </td>
                                  )}
                                  <td>{formatCurrency(p.interestEarned)}</td>
                                  <td>{formatCurrency(p.disbursed)}</td>
                                  <td>{formatCurrency(p.endBalance)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <CashFlowEditor
                          cashFlows={r.cashFlows}
                          onUpdate={(cfs) => onUpdateCashFlows(r.id, cfs)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
