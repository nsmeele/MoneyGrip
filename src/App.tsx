import { useState } from 'react';
import AccountForm from './components/AccountForm';
import ComparisonView from './components/ComparisonView';
import PortfolioSummary from './components/PortfolioSummary';
import ImportModal from './components/ImportModal';
import { useResultStorage } from './hooks/useResultStorage';
import { usePortfolio } from './hooks/usePortfolio';
import { useDataTransfer } from './hooks/useDataTransfer';
import { AccountCalculator } from './calculator/AccountCalculator';
import { BankAccountInput } from './models/BankAccountInput';
import type { BankAccount } from './models/BankAccount';
import type { CashFlow } from './models/CashFlow';

type MobileTab = 'form' | 'results' | 'portfolio';
type RightPanelTab = 'results' | 'portfolio';

export default function App() {
  const { results, addResult, updateResult, removeResult, clearResults, replaceResults, mergeResults } = useResultStorage();
  const { portfolioIds, togglePortfolio, clearPortfolio, replacePortfolio, mergePortfolio } = usePortfolio();
  const transfer = useDataTransfer(results, portfolioIds, replaceResults, mergeResults, replacePortfolio, mergePortfolio);
  const [editingResult, setEditingResult] = useState<BankAccount | null>(null);
  const [activeTab, setActiveTab] = useState<MobileTab>('form');
  const [rightTab, setRightTab] = useState<RightPanelTab>('results');

  const hasPortfolio = results.some((r) => portfolioIds.has(r.id));

  function handleResult(result: BankAccount) {
    if (editingResult) {
      updateResult(editingResult.id, result);
      setEditingResult(null);
    } else {
      addResult(result);
    }
    setActiveTab('results');
  }

  function handleEdit(result: BankAccount) {
    setEditingResult(result);
    setActiveTab('form');
  }

  function handleUpdateCashFlows(id: string, cashFlows: CashFlow[]) {
    const existing = results.find((r) => r.id === id);
    if (!existing) return;

    const calc = new AccountCalculator();
    const input = new BankAccountInput(
      existing.startAmount,
      existing.annualInterestRate,
      existing.durationMonths,
      existing.interval,
      existing.interestType,
      existing.startDate,
      cashFlows,
      existing.isOngoing,
    );
    const recalculated = calc.calculate(input);
    updateResult(id, recalculated);
  }

  return (
    <div className="app-background">
      {transfer.pendingImport && (
        <ImportModal
          preview={transfer.pendingImport}
          onConfirm={transfer.handleConfirmImport}
          onCancel={transfer.handleCancelImport}
        />
      )}
      <div className="app-container">
        <header className="app-header">
          <div className="header-accent" />
          <h1>MoneyGrip</h1>
          <p>Bereken en vergelijk je rente-opbrengsten. Voeg meerdere spaarrekeningen toe en zie in een oogopslag wat je verdient.</p>
        </header>

        <div className="mobile-tabs mobile-tabs--top">
          <button
            className={`mobile-tab${activeTab === 'form' ? ' mobile-tab--active' : ''}`}
            onClick={() => setActiveTab('form')}
          >
            Invoer
          </button>
          <button
            className={`mobile-tab${activeTab === 'results' ? ' mobile-tab--active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            Overzicht
            {results.length > 0 && (
              <span className="mobile-tab-badge">{results.length}</span>
            )}
          </button>
          {hasPortfolio && (
            <button
              className={`mobile-tab${activeTab === 'portfolio' ? ' mobile-tab--active' : ''}`}
              onClick={() => setActiveTab('portfolio')}
            >
              Portefeuille
              <span className="mobile-tab-badge">
                {results.filter((r) => portfolioIds.has(r.id)).length}
              </span>
            </button>
          )}
        </div>

        <main className="main-layout">
          <div className={`main-panel${activeTab !== 'form' ? ' main-panel--hidden' : ''}`}>
            <AccountForm
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
                Overzicht
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
                onUpdateCashFlows={handleUpdateCashFlows}
                onExport={transfer.handleExport}
                onImportFile={transfer.handleFileSelected}
                importError={transfer.importError}
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
