import type { InterestCalculationResult } from '../models/InterestCalculationResult';
import { INTERVAL_LABELS } from '../enums/PayoutInterval';
import { formatCurrency } from '../utils/format';

function rentePerMaand(r: InterestCalculationResult): number {
  if (r.looptijdMaanden === 0) return 0;
  return r.totaleRente / r.looptijdMaanden;
}

interface PortfolioSummaryProps {
  results: InterestCalculationResult[];
  portfolioIds: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
}

export default function PortfolioSummary({ results, portfolioIds, onToggle, onClear }: PortfolioSummaryProps) {
  const items = results.filter((r) => portfolioIds.has(r.id));

  if (items.length === 0) return null;

  const activeItems = items.filter((r) => !r.isVerlopen && !r.isNogNietGestart);
  const totaalIngelegd = activeItems.reduce((sum, r) => sum + r.startBedrag, 0);
  const totaalRente = items.reduce((sum, r) => sum + r.totaleRente, 0);
  const totaalPerMaand = activeItems.reduce((sum, r) => sum + rentePerMaand(r), 0);

  return (
    <div className="portfolio">
      <div className="portfolio-header">
        <h2>
          Portfolio
          <span className="results-count">{items.length}</span>
        </h2>
        <button className="btn-danger" onClick={onClear}>
          Leegmaken
        </button>
      </div>

      <div className="portfolio-stats">
        <div className="portfolio-stat">
          <div className="portfolio-stat-label">Totaal ingelegd</div>
          <div className="portfolio-stat-value">{formatCurrency(totaalIngelegd)}</div>
        </div>
        <div className="portfolio-stat">
          <div className="portfolio-stat-label">Totale rente</div>
          <div className="portfolio-stat-value">{formatCurrency(totaalRente)}</div>
        </div>
        <div className="portfolio-stat portfolio-stat--highlight">
          <div className="portfolio-stat-label">Gemiddeld per maand</div>
          <div className="portfolio-stat-value">{formatCurrency(totaalPerMaand)}</div>
        </div>
      </div>

      <div className="portfolio-items">
        {items.map((r) => (
          <div key={r.id} className={`portfolio-item${r.isVerlopen ? ' portfolio-item--verlopen' : ''}${r.isNogNietGestart ? ' portfolio-item--toekomstig' : ''}`}>
            <div className="portfolio-item-info">
              <span className="portfolio-item-label">
                {r.label}
                {r.isVerlopen && <span className="badge-verlopen">Verlopen</span>}
                {r.isNogNietGestart && <span className="badge-toekomstig">Toekomstig</span>}
              </span>
              <span className="portfolio-item-meta">
                {INTERVAL_LABELS[r.interval]}
              </span>
            </div>
            <div className="portfolio-item-amount">
              {formatCurrency(rentePerMaand(r))}/mnd
            </div>
            <button
              className="btn-icon"
              title="Verwijder uit portfolio"
              onClick={() => onToggle(r.id)}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
