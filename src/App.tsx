import { useEffect, useState } from 'react';
import BankAccountsOverview from './components/BankAccountsOverview';
import PortfolioSummary from './components/PortfolioSummary';
import ThemeToggle from './components/ThemeToggle/ThemeToggle';
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
                Baas over je rente.
              </p>
            </div>
            <div className="hero-top__actions">
              <button
                className="btn-start"
                onClick={handleNewAccount}
              >
                Nieuwe rekening
              </button>
              <button
                className="btn-guide-link"
                onClick={() => setShowGuide((v) => !v)}
                aria-expanded={showGuide}
                aria-controls="usage-guide"
              >
                {showGuide ? 'Verberg uitleg' : 'Hoe werkt het?'}
                <span className={`btn-guide-link__chevron${showGuide ? ' btn-guide-link__chevron--open' : ''}`} aria-hidden="true">&#8250;</span>
              </button>
              <ThemeToggle />
              {hasData && <ClearDataButton onClear={clearAllData} />}
            </div>
          </div>

          {showGuide && (
            <section id="usage-guide" className="usage-guide" aria-label="Uitleg en features">
              <div className="usage-guide__layout">
                <div className="usage-guide__features">
                  <h2 className="usage-guide__heading">Wat kan MoneyGrip?</h2>
                  <ul className="feature-list">
                    <li className="feature-list__item">
                      <span className="feature-list__label">Enkelvoudige &amp; samengestelde rente</span>
                    </li>
                    <li className="feature-list__item">
                      <span className="feature-list__label">Variabele rente met rentewijzigingen</span>
                    </li>
                    <li className="feature-list__item">
                      <span className="feature-list__label">Stortingen &amp; opnames (eenmalig of terugkerend)</span>
                    </li>
                    <li className="feature-list__item">
                      <span className="feature-list__label">4 day count methodes (NOM/12, ACT/365, ACT/ACT, 30/360)</span>
                    </li>
                    <li className="feature-list__item">
                      <span className="feature-list__label">6 uitbetalingsintervallen (dagelijks t/m einde looptijd)</span>
                    </li>
                    <li className="feature-list__item">
                      <span className="feature-list__label">Portefeuille-overzicht met maandelijkse rente-tracking</span>
                    </li>
                    <li className="feature-list__item">
                      <span className="feature-list__label">Import &amp; export van berekeningen</span>
                    </li>
                  </ul>
                </div>
                <div className="usage-guide__steps-wrapper">
                  <h2 className="usage-guide__heading">Hoe gebruik je het?</h2>
                  <ol className="usage-guide__steps">
                    <li className="usage-guide__step">
                      <span className="usage-guide__number">1</span>
                      <div>
                        <strong>Rekeninggegevens invoeren</strong>
                        <span className="usage-guide__detail">Inleg, rente, looptijd, startdatum, rentetype en berekeningsmethode.</span>
                      </div>
                    </li>
                    <li className="usage-guide__step">
                      <span className="usage-guide__number">2</span>
                      <div>
                        <strong>Transacties &amp; rentewijzigingen toevoegen</strong>
                        <span className="usage-guide__detail">Optioneel: bij- en afschrijvingen plannen en rente aanpassen over de looptijd.</span>
                      </div>
                    </li>
                    <li className="usage-guide__step">
                      <span className="usage-guide__number">3</span>
                      <div>
                        <strong>Resultaat per periode bekijken</strong>
                        <span className="usage-guide__detail">Opgebouwde rente, saldo en uitbetalingen per periode — inclusief de stand van vandaag.</span>
                      </div>
                    </li>
                    <li className="usage-guide__step">
                      <span className="usage-guide__number">4</span>
                      <div>
                        <strong>Vergelijken in je portefeuille</strong>
                        <span className="usage-guide__detail">Meerdere rekeningen combineren en totale rente-opbrengsten vergelijken.</span>
                      </div>
                    </li>
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
            <strong>Privacy:</strong> MoneyGrip werkt volledig in je browser. Je gegevens worden lokaal opgeslagen op je apparaat en worden nooit naar een server verstuurd. Er worden geen cookies geplaatst en er vindt geen tracking plaats. Let op: geëxporteerde bestanden bevatten al je rekeninggegevens — bewaar deze op een veilige plek en deel ze niet onbedoeld.
          </p>
          <p>
            <strong>Disclaimer:</strong> MoneyGrip is een hulpmiddel voor indicatieve renteberekeningen. Aan de weergegeven bedragen, berekeningen en overzichten kunnen geen rechten worden ontleend. Raadpleeg altijd je bank of financieel adviseur voor definitieve cijfers. De maker van deze applicatie is niet aansprakelijk voor eventuele onjuistheden of beslissingen op basis van deze berekeningen.
          </p>
        </footer>
      </div>
    </div>
    </ThemeContext.Provider>
  );
}
