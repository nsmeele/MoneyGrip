import { Fragment, useState } from 'react';
import type { InterestCalculationResult } from '../models/InterestCalculationResult';
import { INTERVAL_LABELS } from '../enums/PayoutInterval';
import { RENTE_TYPE_LABELS } from '../enums/RenteType';
import { formatCurrency, formatLooptijdKort, formatDate } from '../utils/format';

interface ComparisonViewProps {
  results: InterestCalculationResult[];
  onRemove: (id: string) => void;
  onClear: () => void;
  portfolioIds: Set<string>;
  onTogglePortfolio: (id: string) => void;
  onEdit: (result: InterestCalculationResult) => void;
}

export default function ComparisonView({ results, onRemove, onClear, portfolioIds, onTogglePortfolio, onEdit }: ComparisonViewProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (results.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">&#x1f4ca;</div>
        <h3>Nog geen berekeningen</h3>
        <p>Vul het formulier in om renteberekeningen te vergelijken.</p>
      </div>
    );
  }

  const bestRenteId = results.length >= 2
    ? results.reduce((best, r) => r.totaleRente > best.totaleRente ? r : best).id
    : null;

  return (
    <div className="results-section">
      <div className="results-header">
        <h2>
          Rekeningen
          <span className="results-count">{results.length}</span>
        </h2>
        <button className="btn-danger" onClick={onClear}>
          Alles wissen
        </button>
      </div>

      <div className="comparison-table-wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th></th>
              <th>Scenario</th>
              <th>Type</th>
              <th>Interval</th>
              <th>Looptijd</th>
              <th>Startdatum</th>
              <th>Einddatum</th>
              <th>Startbedrag</th>
              <th>Totale rente</th>
              <th>Eindbedrag</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => {
              const isOpen = openId === r.id;
              const isBest = r.id === bestRenteId;

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
                    <td>{r.jaarRentePercentage}%</td>
                    <td>{RENTE_TYPE_LABELS[r.renteType]}</td>
                    <td>{INTERVAL_LABELS[r.interval]}</td>
                    <td>{formatLooptijdKort(r.looptijdMaanden)}</td>
                    <td>{r.startDatum ? formatDate(r.startDatum) : '—'}</td>
                    <td>{r.eindDatum ? formatDate(r.eindDatum) : '—'}</td>
                    <td className="amount">{formatCurrency(r.startBedrag)}</td>
                    <td className={`amount${isBest ? ' highlight-best' : ''}`}>
                      {formatCurrency(r.totaleRente)}
                      {isBest && ' \u2605'}
                    </td>
                    <td className="amount">{formatCurrency(r.eindBedrag)}</td>
                    <td className="comparison-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn-icon"
                        title="Bewerken"
                        onClick={() => onEdit(r)}
                      >
                        &#9998;
                      </button>
                      <button
                        className={`btn-portfolio${portfolioIds.has(r.id) ? ' btn-portfolio--active' : ''}`}
                        title={portfolioIds.has(r.id) ? 'Verwijder uit portfolio' : 'Toevoegen aan portfolio'}
                        onClick={() => onTogglePortfolio(r.id)}
                      >
                        {portfolioIds.has(r.id) ? '\u2605' : '\u2606'}
                      </button>
                      <button
                        className="btn-icon"
                        title="Verwijder"
                        onClick={() => onRemove(r.id)}
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
                                <th>Rente</th>
                                <th>Uitbetaald</th>
                                <th>Eindsaldo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.perioden.map((p) => (
                                <tr key={p.periode}>
                                  <td>{p.periodeLabel}</td>
                                  <td>{formatCurrency(p.beginSaldo)}</td>
                                  <td>{formatCurrency(p.renteOpbrengst)}</td>
                                  <td>{formatCurrency(p.uitbetaald)}</td>
                                  <td>{formatCurrency(p.eindSaldo)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
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
    </div>
  );
}
