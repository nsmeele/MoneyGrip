import { useState } from 'react';
import CalculatorForm from './components/CalculatorForm';
import ComparisonView from './components/ComparisonView';
import PortfolioSummary from './components/PortfolioSummary';
import { useResultStorage } from './hooks/useResultStorage';
import { usePortfolio } from './hooks/usePortfolio';
import type { InterestCalculationResult } from './models/InterestCalculationResult';

type MobileTab = 'form' | 'results' | 'portfolio';
type RightPanelTab = 'results' | 'portfolio';

export default function App() {
  const { results, addResult, updateResult, removeResult, clearResults } = useResultStorage();
  const { portfolioIds, togglePortfolio, clearPortfolio } = usePortfolio();
  const [editingResult, setEditingResult] = useState<InterestCalculationResult | null>(null);
  const [activeTab, setActiveTab] = useState<MobileTab>('form');
  const [rightTab, setRightTab] = useState<RightPanelTab>('results');

  const hasPortfolio = results.some((r) => portfolioIds.has(r.id));

  function handleResult(result: InterestCalculationResult) {
    if (editingResult) {
      updateResult(editingResult.id, result);
      setEditingResult(null);
    } else {
      addResult(result);
    }
    setActiveTab('results');
  }

  function handleEdit(result: InterestCalculationResult) {
    setEditingResult(result);
    setActiveTab('form');
  }

  return (
    <div className="app-background">
      <div className="app-container">
        <header className="app-header">
          <div className="header-accent" />
          <h1>Rente Calculator</h1>
          <p>Vergelijk renteberekeningen met verschillende uitbetalingsintervallen</p>
        </header>

        <div className="mobile-tabs mobile-tabs--top">
          <button
            className={`mobile-tab${activeTab === 'form' ? ' mobile-tab--active' : ''}`}
            onClick={() => setActiveTab('form')}
          >
            Berekening
          </button>
          <button
            className={`mobile-tab${activeTab === 'results' ? ' mobile-tab--active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            Rekeningen
            {results.length > 0 && (
              <span className="mobile-tab-badge">{results.length}</span>
            )}
          </button>
          {hasPortfolio && (
            <button
              className={`mobile-tab${activeTab === 'portfolio' ? ' mobile-tab--active' : ''}`}
              onClick={() => setActiveTab('portfolio')}
            >
              Portfolio
              <span className="mobile-tab-badge">
                {results.filter((r) => portfolioIds.has(r.id)).length}
              </span>
            </button>
          )}
        </div>

        <main className="main-layout">
          <div className={`main-panel${activeTab !== 'form' ? ' main-panel--hidden' : ''}`}>
            <CalculatorForm
              onResult={handleResult}
              editingResult={editingResult}
              onCancelEdit={() => setEditingResult(null)}
            />
          </div>
          <div className={`main-panel${activeTab !== 'results' && activeTab !== 'portfolio' ? ' main-panel--hidden' : ''}`}>
            <div className="mobile-tabs mobile-tabs--panel">
              <button
                className={`mobile-tab${rightTab === 'results' ? ' mobile-tab--active' : ''}`}
                onClick={() => setRightTab('results')}
              >
                Rekeningen
                {results.length > 0 && (
                  <span className="mobile-tab-badge">{results.length}</span>
                )}
              </button>
              {hasPortfolio && (
                <button
                  className={`mobile-tab${rightTab === 'portfolio' ? ' mobile-tab--active' : ''}`}
                  onClick={() => setRightTab('portfolio')}
                >
                  Portefeuille
                  <span className="mobile-tab-badge">
                    {results.filter((r) => portfolioIds.has(r.id)).length}
                  </span>
                </button>
              )}
            </div>
            <div className={`${activeTab === 'portfolio' ? 'mobile-hidden' : ''}${rightTab !== 'results' ? ' desktop-hidden' : ''}`}>
              <ComparisonView
                results={results}
                onRemove={removeResult}
                onClear={clearResults}
                portfolioIds={portfolioIds}
                onTogglePortfolio={togglePortfolio}
                onEdit={handleEdit}
              />
            </div>
            <div className={`${activeTab === 'results' ? 'mobile-hidden' : ''}${rightTab !== 'portfolio' ? ' desktop-hidden' : ''}`}>
              <PortfolioSummary
                results={results}
                portfolioIds={portfolioIds}
                onToggle={togglePortfolio}
                onClear={clearPortfolio}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
