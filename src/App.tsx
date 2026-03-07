import {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import BankAccountsOverview from './components/BankAccountsOverview';
import PortfolioSummary from './components/PortfolioSummary';
import ThemeToggle from './components/ThemeToggle/ThemeToggle';
import LanguageSwitcher from './components/LanguageSwitcher';
import {useResultStorage} from './hooks/useResultStorage';
import {usePortfolio} from './hooks/usePortfolio';
import {useDataTransfer} from './hooks/useDataTransfer';
import {useModal} from './context/useModal';
import {useThemeProvider, ThemeContext} from './hooks/useTheme';
import {LocaleProvider} from './context/LocaleContext';
import CurrencySelector from './components/CurrencySelector';
import {useLastTabClear} from './hooks/useLastTabClear';
import ClearDataButton from './components/ClearDataButton';
import {
    BanknotesIcon,
    ChartBarIcon,
    ArrowUpTrayIcon,
    ArrowDownTrayIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';
import {AccountCalculator} from './calculator/AccountCalculator';
import {BankAccountInput} from './models/BankAccountInput';
import type {BankAccount} from './models/BankAccount';
import type {CashFlow} from './models/CashFlow';
import type {RateChange} from './models/RateChange';
import {demoData} from './transfer/demoData';
import {ModalProvider} from './context/ModalContext';
import {APP_NAME, GITHUB_URL} from './constants/app';
import {useDocumentMeta} from './hooks/useDocumentMeta';

export default function App() {
    const themeCtx = useThemeProvider();

    return (
        <LocaleProvider>
            <ThemeContext.Provider value={themeCtx}>
                <ModalProvider>
                    <AppContent/>
                </ModalProvider>
            </ThemeContext.Provider>
        </LocaleProvider>
    );
}

function AppContent() {
    useDocumentMeta();
    const {t} = useTranslation();
    const {
        results,
        addResult,
        updateResult,
        removeResult,
        clearResults,
        replaceResults,
        mergeResults
    } = useResultStorage();
    const {portfolioIds, togglePortfolio, clearPortfolio, replacePortfolio, mergePortfolio} = usePortfolio();
    const transfer = useDataTransfer(results, portfolioIds, replaceResults, mergeResults, replacePortfolio, mergePortfolio);
    const {openModal} = useModal();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dataMenuRef = useRef<HTMLDivElement>(null);
    const [showDataMenu, setShowDataMenu] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [mobileTab, setMobileTab] = useState<'accounts' | 'portfolio'>('accounts');

    const closeDataMenu = useCallback(() => setShowDataMenu(false), []);

    useEffect(() => {
        if (!showDataMenu) return;

        function handleClick(e: MouseEvent) {
            if (dataMenuRef.current && !dataMenuRef.current.contains(e.target as Node)) {
                closeDataMenu();
            }
        }

        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showDataMenu, closeDataMenu]);

    const hasData = results.length > 0 || portfolioIds.size > 0;
    const {clearAllData} = useLastTabClear({hasData, clearResults, clearPortfolio});

    const {pendingImport, handleConfirmImport, handleCancelImport} = transfer;
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

    function handleImportClick() {
        fileInputRef.current?.click();
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            transfer.handleFileSelected(file);
            e.target.value = '';
        }
    }

    function handleExportClick() {
        openModal({
            type: 'export',
            resultCount: results.length,
            onConfirm: () => transfer.handleExport(),
        });
    }

    const hasResults = results.length > 0;
    const effectiveMobileTab = hasResults ? mobileTab : 'accounts';

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

    function handleLoadDemo() {
        replaceResults(demoData.results);
        replacePortfolio(demoData.portfolioIds);
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
            existing.currency,
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
            existing.currency,
        );
        const recalculated = calc.calculate(input);
        updateResult(id, recalculated);
    }

    return (
        <div className="app-background">
            <div className="app-container">
                <header className="app-header">
                    <div className="app-toolbar">
                        {hasData && (
                            <>
                                <div className="toolbar-dropdown" ref={dataMenuRef}>
                                    <button
                                        className="btn-action btn-action--muted"
                                        onClick={() => setShowDataMenu((v) => !v)}
                                        aria-expanded={showDataMenu}
                                        aria-haspopup="true"
                                        aria-label={t('accounts.import')}
                                    >
                                        <ArrowUpTrayIcon aria-hidden="true"/>
                                        <span className="toolbar-label">{t('accounts.import')}</span>
                                        <ChevronDownIcon className={`toolbar-dropdown__chevron${showDataMenu ? ' toolbar-dropdown__chevron--open' : ''}`} aria-hidden="true"/>
                                    </button>
                                    {showDataMenu && (
                                        <div className="toolbar-dropdown__menu" role="menu">
                                            <button className="toolbar-dropdown__item" role="menuitem" onClick={() => {
                                                handleImportClick();
                                                closeDataMenu();
                                            }}>
                                                <ArrowUpTrayIcon aria-hidden="true"/>
                                                {t('accounts.import')}
                                            </button>
                                            <button className="toolbar-dropdown__item toolbar-dropdown__item--muted" role="menuitem" onClick={() => {
                                                handleExportClick();
                                                closeDataMenu();
                                            }}>
                                                <ArrowDownTrayIcon aria-hidden="true"/>
                                                {t('accounts.export')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <span className="toolbar-separator" aria-hidden="true"/>
                                <ClearDataButton onClear={clearAllData}/>
                                <span className="toolbar-separator" aria-hidden="true"/>
                            </>
                        )}
                        <CurrencySelector/>
                        <LanguageSwitcher/>
                        <ThemeToggle/>
                        <a
                            href={GITHUB_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="toolbar-icon-link"
                            aria-label={t('footer.openSource')}
                            title={t('footer.viewOnGitHub')}
                        >
                            <svg className="toolbar-icon-link__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                            </svg>
                        </a>
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
                    {transfer.importError && (
                        <p className="data-transfer__error" role="alert">{transfer.importError}</p>
                    )}
                    <div className="hero-top">
                        <div className="hero-top__text">
                            <div className="header-accent"/>
                            <h1>{APP_NAME}</h1>
                            <p className="app-header__tagline">
                                {t('app.tagline')}
                            </p>
                        </div>
                        <div className="hero-top__actions">
                            <button
                                className="btn-guide-link"
                                onClick={() => setShowGuide((v) => !v)}
                                aria-expanded={showGuide}
                                aria-controls="usage-guide"
                            >
                                {showGuide ? t('app.hideGuide') : t('app.showGuide')}
                                <span className={`btn-guide-link__chevron${showGuide ? ' btn-guide-link__chevron--open' : ''}`} aria-hidden="true">&#8250;</span>
                            </button>
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
                    <div className={`main-section${effectiveMobileTab === 'accounts' ? ' main-section--active' : ''}`}>
                        <BankAccountsOverview
                            results={results}
                            onRemove={removeResult}
                            portfolioIds={portfolioIds}
                            onTogglePortfolio={togglePortfolio}
                            onEdit={handleEdit}
                            onNewAccount={handleNewAccount}
                            onUpdateCashFlows={handleUpdateCashFlows}
                            onUpdateRateChanges={handleUpdateRateChanges}
                            onImport={handleImportClick}
                            onLoadDemo={handleLoadDemo}
                        />
                    </div>
                    {hasResults && (
                        <div className={`main-section${effectiveMobileTab === 'portfolio' ? ' main-section--active' : ''}`}>
                            <PortfolioSummary
                                results={results}
                                portfolioIds={portfolioIds}
                                onToggle={togglePortfolio}
                            />
                        </div>
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
            {hasResults && (
                <nav className="mobile-tab-bar" aria-label={t('nav.ariaLabel')}>
                    <button
                        className={`mobile-tab${effectiveMobileTab === 'accounts' ? ' mobile-tab--active' : ''}`}
                        onClick={() => setMobileTab('accounts')}
                    >
                        <BanknotesIcon aria-hidden="true"/>
                        <span>{t('accounts.sectionLabel')}</span>
                    </button>
                    <button
                        className={`mobile-tab${effectiveMobileTab === 'portfolio' ? ' mobile-tab--active' : ''}`}
                        onClick={() => setMobileTab('portfolio')}
                    >
                        <ChartBarIcon aria-hidden="true"/>
                        <span>{t('portfolio.title')}</span>
                    </button>
                </nav>
            )}
        </div>
    );
}
