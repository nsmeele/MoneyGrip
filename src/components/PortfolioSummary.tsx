import type { BankAccount } from '../models/BankAccount';
import { INTERVAL_LABELS } from '../enums/PayoutInterval';
import { formatCurrency } from '../utils/format';
import { interestPerMonth } from '../utils/interest';
import PortfolioChart from './PortfolioChart';

interface PortfolioSummaryProps {
  results: BankAccount[];
  portfolioIds: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
}

export default function PortfolioSummary({ results, portfolioIds, onToggle, onClear }: PortfolioSummaryProps) {
  const items = results.filter((r) => portfolioIds.has(r.id));

  if (items.length === 0) return null;

  const activeItems = items.filter((r) => !r.hasExpired && !r.hasNotStartedYet);
  const totalInvested = activeItems.reduce((sum, r) => sum + r.startAmount + Math.max(0, r.totalDeposited), 0);
  const totalInterest = items.reduce((sum, r) => sum + r.totalInterest, 0);
  const totalPerMonth = activeItems.reduce((sum, r) => sum + interestPerMonth(r), 0);

  return (
    <div className="card portfolio">
      <div className="card-header">
        <div className="results-header">
          <div>
            <h2>
              Portefeuille
              <span className="results-count">{items.length}</span>
            </h2>
          </div>
          <button className="btn-danger" onClick={onClear}>
            Leegmaken
          </button>
        </div>
      </div>

      <div className="card-body">
      <div className="portfolio-stats">
        <div className="portfolio-stat">
          <div className="portfolio-stat-label">Totaal ingelegd</div>
          <div className="portfolio-stat-value">{formatCurrency(totalInvested)}</div>
        </div>
        <div className="portfolio-stat">
          <div className="portfolio-stat-label">Totale rente</div>
          <div className="portfolio-stat-value">{formatCurrency(totalInterest)}</div>
        </div>
        <div className="portfolio-stat portfolio-stat--highlight">
          <div className="portfolio-stat-label">Gem. per maand</div>
          <div className="portfolio-stat-value">{formatCurrency(totalPerMonth)}</div>
        </div>
      </div>

      <PortfolioChart items={activeItems} />

      <div className="portfolio-items">
        {items.map((r) => (
          <div key={r.id} className={`portfolio-item${r.hasExpired ? ' portfolio-item--expired' : ''}${r.hasNotStartedYet ? ' portfolio-item--upcoming' : ''}`}>
            <div className="portfolio-item-info">
              <span className="portfolio-item-label">
                {r.label}
                {r.isOngoing && <span className="badge-ongoing">Lopend</span>}
                {r.hasExpired && <span className="badge-expired">Verlopen</span>}
                {r.hasNotStartedYet && <span className="badge-upcoming">Toekomstig</span>}
              </span>
              <span className="portfolio-item-meta">
                {INTERVAL_LABELS[r.interval]}
              </span>
            </div>
            <div className="portfolio-item-amount">
              {formatCurrency(interestPerMonth(r))}/mnd
            </div>
            <button
              className="btn-icon"
              title="Verwijder uit portefeuille"
              onClick={() => onToggle(r.id)}
              aria-label="Verwijder uit portefeuille"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
