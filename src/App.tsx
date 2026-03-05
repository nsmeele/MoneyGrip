import { useState } from 'react';
import CalculatorForm from './components/CalculatorForm';
import ComparisonView from './components/ComparisonView';
import PortfolioSummary from './components/PortfolioSummary';
import { useResultStorage } from './hooks/useResultStorage';
import { usePortfolio } from './hooks/usePortfolio';
import type { InterestCalculationResult } from './models/InterestCalculationResult';

export default function App() {
  const { results, addResult, updateResult, removeResult, clearResults } = useResultStorage();
  const { portfolioIds, togglePortfolio, clearPortfolio } = usePortfolio();
  const [editingResult, setEditingResult] = useState<InterestCalculationResult | null>(null);

  function handleResult(result: InterestCalculationResult) {
    if (editingResult) {
      updateResult(editingResult.id, result);
      setEditingResult(null);
    } else {
      addResult(result);
    }
  }

  return (
    <div className="app-background">
      <div className="app-container">
        <header className="app-header">
          <div className="header-accent" />
          <h1>Rente Calculator</h1>
          <p>Vergelijk renteberekeningen met verschillende uitbetalingsintervallen</p>
        </header>

        <PortfolioSummary
          results={results}
          portfolioIds={portfolioIds}
          onToggle={togglePortfolio}
          onClear={clearPortfolio}
        />

        <main className="main-layout">
          <CalculatorForm
            onResult={handleResult}
            editingResult={editingResult}
            onCancelEdit={() => setEditingResult(null)}
          />
          <ComparisonView
            results={results}
            onRemove={removeResult}
            onClear={clearResults}
            portfolioIds={portfolioIds}
            onTogglePortfolio={togglePortfolio}
            onEdit={setEditingResult}
          />
        </main>
      </div>
    </div>
  );
}
