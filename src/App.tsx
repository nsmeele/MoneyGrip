import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import BankAccountsOverview from './components/BankAccountsOverview';
import PortfolioSummary from './components/PortfolioSummary';
import ThemeToggle from './components/ThemeToggle/ThemeToggle';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useResultStorage } from './hooks/useResultStorage';
import { usePortfolio } from './hooks/usePortfolio';
import { useDataTransfer } from './hooks/useDataTransfer';
import { useModal } from './context/ModalContext';
import { useThemeProvider, ThemeContext } from './hooks/useTheme';
import { useLastTabClear } from './hooks/useLastTabClear';
import ClearDataButton from './components/ClearDataButton';
import { AccountCalculator } from './calculator/AccountCalculator';
import { BankAccountInput } from './models/BankAccountInput';
import type { BankAccount } from './models/BankAccount';
import type { CashFlow } from './models/CashFlow';
import type { RateChange } from './models/RateChange';

export default function App() {
  const { t } = useTranslation();
  const themeCtx = useThemeProvider();
  const { results, addResult, updateResult, removeResult, clearResults, replaceResults, mergeResults } = useResultStorage();
  const { portfolioIds, togglePortfolio, clearPortfolio, replacePortfolio, mergePortfolio } = usePortfolio();
  const transfer = useDataTransfer(results, portfolioIds, replaceResults, mergeResults, replacePortfolio, mergePortfolio);
  const { openModal } = useModal();
  const [showGuide, setShowGuide] = useState(false);

  const hasData = results.length > 0 || portfolioIds.size > 0;
  const { clearAllData } = useLastTabClear({ hasData, clearResults, clearPortfolio });

  const { pendingImport, handleConfirmImport, handleCancelImport } = transfer;
  useEffect(() => {
    if (pendingImport) {
      openModal({
        type: 'import',
        preview: pendingImport,
        onConfirm: (mode) => handleConfirmImport(mode),
        onCancel: () => handleCancelImport(),
      });
    }
  }, [pendingImport, openModal, handleConfirmImport, handleCancelImport]);

  function handleExportClick() {
    openModal({
      type: 'export',
      resultCount: results.length,
      onConfirm: () => transfer.handleExport(),
    });
  }

  const hasPortfolio = results.some((r) => portfolioIds.has(r.id));

  function handleNewAccount() {
    openModal({
      type: 'account',
      editingResult: null,
      onResult: addResult,
    });
  }

  function handleEdit(result: BankAccount) {
    openModal({
      type: 'account',
      editingResult: result,
      onResult: (updated) => updateResult(result.id, updated),
    });
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
      existing.dayCount,
      existing.rateChanges,
      existing.isVariableRate,
    );
    const recalculated = calc.calculate(input);
    updateResult(id, recalculated);
  }

  function handleUpdateRateChanges(id: string, rateChanges: RateChange[]) {
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
      existing.cashFlows,
      existing.isOngoing,
      existing.dayCount,
      rateChanges,
      existing.isVariableRate,
    );
    const recalculated = calc.calculate(input);
    updateResult(id, recalculated);
  }

  return (
    <ThemeContext.Provider value={themeCtx}>
    <div className="app-background">
      <div className="app-container">
        <header className="app-header">
          <div className="hero-top">
            <div className="hero-top__text">
              <div className="header-accent" />
              <h1>MoneyGrip</h1>
              <p className="app-header__tagline">
                {t('app.tagline')}
              </p>
            </div>
            <div className="hero-top__actions">
              <button
                className="btn-start"
                onClick={handleNewAccount}
              >
                {t('app.newAccount')}
              </button>
              <button
                className="btn-guide-link"
                onClick={() => setShowGuide((v) => !v)}
                aria-expanded={showGuide}
                aria-controls="usage-guide"
              >
                {showGuide ? t('app.hideGuide') : t('app.showGuide')}
                <span className={`btn-guide-link__chevron${showGuide ? ' btn-guide-link__chevron--open' : ''}`} aria-hidden="true">&#8250;</span>
              </button>
              <ThemeToggle />
              <LanguageSwitcher />
              {hasData && <ClearDataButton onClear={clearAllData} />}
            </div>
          </div>

          {showGuide && (
            <section id="usage-guide" className="usage-guide" aria-label={t('guide.ariaLabel')}>
              <div className="usage-guide__layout">
                <div className="usage-guide__features">
                  <h2 className="usage-guide__heading">{t('guide.featuresHeading')}</h2>
                  <ul className="feature-list">
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <li key={n} className="feature-list__item">
                        <span className="feature-list__label">{t(`guide.feature${n}`)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="usage-guide__steps-wrapper">
                  <h2 className="usage-guide__heading">{t('guide.stepsHeading')}</h2>
                  <ol className="usage-guide__steps">
                    {[1, 2, 3, 4].map((n) => (
                      <li key={n} className="usage-guide__step">
                        <span className="usage-guide__number">{n}</span>
                        <div>
                          <strong>{t(`guide.step${n}Title`)}</strong>
                          <span className="usage-guide__detail">{t(`guide.step${n}Detail`)}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </section>
          )}
        </header>

        <main className="main-layout">
          <BankAccountsOverview
            results={results}
            onRemove={removeResult}
            onClear={clearResults}
            portfolioIds={portfolioIds}
            onTogglePortfolio={togglePortfolio}
            onEdit={handleEdit}
            onNewAccount={handleNewAccount}
            onUpdateCashFlows={handleUpdateCashFlows}
            onUpdateRateChanges={handleUpdateRateChanges}
            onExport={handleExportClick}
            onImportFile={transfer.handleFileSelected}
            importError={transfer.importError}
          />
          {hasPortfolio && (
            <PortfolioSummary
              results={results}
              portfolioIds={portfolioIds}
              onToggle={togglePortfolio}
              onClear={clearPortfolio}
            />
          )}
        </main>

        <footer className="app-disclaimer">
          <p>
            <strong>{t('footer.privacyLabel')}</strong> {t('footer.privacyText')}
          </p>
          <p>
            <strong>{t('footer.disclaimerLabel')}</strong> {t('footer.disclaimerText')}
          </p>
        </footer>
      </div>
    </div>
    </ThemeContext.Provider>
  );
}
