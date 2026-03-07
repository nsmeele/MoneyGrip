import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router';
import { ArrowLeftIcon, PencilIcon, XMarkIcon, ChevronRightIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import { useAccountStore } from '../../context/useAccountStore';
import { useLocale } from '../../context/useLocale';
import { useModal } from '../../context/useModal';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { InterestType, getInterestTypeLabel } from '../../enums/InterestType';
import { PayoutInterval, getIntervalLabel } from '../../enums/PayoutInterval';
import { getDayCountLabel, getDayCountDescription } from '../../enums/DayCountConvention';
import { getAccountTypeLabel } from '../../enums/AccountType';
import type { Currency } from '../../enums/Currency';
import { formatCurrency, formatDuration, formatDate, formatRate } from '../../utils/format';
import { toMonthKey, todayISO, parseDate, addMonthsToISO } from '../../utils/date';
import { getMonthDays } from '../../utils/monthDays';
import CashFlowEditor, { type AutoCashFlow } from '../../components/CashFlowEditor';
import RateChangeEditor from '../../components/RateChangeEditor';
import AccountBalanceChart from '../../components/AccountBalanceChart';
import { APP_NAME } from '../../constants/app';
import './AccountDetailPage.css';

export default function AccountDetailPage() {
  useDocumentMeta();
  const { t } = useTranslation();
  const { lang, id } = useParams();
  const navigate = useNavigate();
  const { currency: globalCurrency } = useLocale();
  const {
    results, updateResult, removeResult,
    portfolioIds, togglePortfolio,
    handleUpdateCashFlows, handleUpdateRateChanges,
  } = useAccountStore();
  const { openModal } = useModal();

  const account = results.find((r) => r.id === id);

  function handleEdit() {
    if (!account) return;
    openModal({
      type: 'account',
      editingResult: account,
      onResult: (updated) => updateResult(account.id, updated),
    });
  }

  function handleDelete() {
    if (!account) return;
    openModal({
      type: 'confirm',
      title: t('accounts.confirmDeleteTitle'),
      message: t('accounts.confirmDeleteMessage'),
      confirmLabel: t('accounts.confirmDeleteButton'),
      onConfirm: () => {
        removeResult(account.id);
        navigate(`/${lang}`);
      },
    });
  }

  if (!account) {
    return (
      <div className="app-background">
        <div className="app-container">
          <div className="detail-not-found">
            <h2>{t('detail.notFound')}</h2>
            <p>{t('detail.notFoundDescription')}</p>
            <Link to={`/${lang}`} className="btn-action">
              <ArrowLeftIcon aria-hidden="true" />
              {t('detail.backToOverview')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const cur = (account.currency as Currency | undefined) ?? globalCurrency;
  const balance = account.interestType === InterestType.Compound
    ? account.currentBalance + account.disbursedToDate
    : account.currentBalance;
  const inPortfolio = portfolioIds.has(account.id);

  const properties: { label: string; value: string; highlight?: boolean; badge?: string; info?: string }[] = [];
  if (account.accountType) {
    properties.push({ label: t('accountType.label'), value: getAccountTypeLabel(account.accountType) });
  }
  if (account.startDate) {
    properties.push({ label: t('form.startDate'), value: formatDate(account.startDate) });
  }
  if (account.isOngoing) {
    properties.push({ label: t('accounts.endDate'), value: '', badge: t('accounts.ongoing') });
  } else if (account.endDate) {
    properties.push({ label: t('accounts.endDate'), value: formatDate(account.endDate) });
  }
  if (!account.isOngoing) {
    properties.push({ label: t('form.duration'), value: formatDuration(account.durationMonths) });
  }
  properties.push({ label: t('form.interestType'), value: getInterestTypeLabel(account.interestType) });
  properties.push({ label: t('form.payoutLabel'), value: getIntervalLabel(account.interval) });
  properties.push({ label: t('form.dayCountConvention'), value: getDayCountLabel(account.dayCount), info: getDayCountDescription(account.dayCount) });
  if (account.currency) {
    properties.push({ label: t('currency.label'), value: account.currency.toUpperCase() });
  }
  properties.push({ label: t('accounts.deposit'), value: formatCurrency(account.startAmount, cur) });
  if (!account.isOngoing) {
    properties.push({ label: t('accounts.totalInterest'), value: formatCurrency(account.totalInterest, cur), highlight: true });
    properties.push({ label: t('accounts.endAmount'), value: formatCurrency(account.endAmount, cur) });
  }
  properties.push({ label: t('accounts.interestThisMonth'), value: formatCurrency(account.interestThisMonth, cur), info: t('accounts.interestThisMonthInfo') });

  const compoundPayouts: AutoCashFlow[] = account.interestType === InterestType.Compound
    ? account.periods
        .filter((p) => p.endDate && p.disbursed > 0)
        .map((p) => ({ date: p.endDate!, amount: p.disbursed, description: t('accounts.payout') }))
        .filter((p) => {
          const monthKey = toMonthKey(todayISO());
          const prevMonthKey = toMonthKey(addMonthsToISO(`${monthKey}-01`, -1));
          const nextMonthKey = toMonthKey(addMonthsToISO(`${monthKey}-01`, 1));
          const pMonthKey = toMonthKey(p.date);
          return pMonthKey === prevMonthKey || pMonthKey === monthKey || pMonthKey === nextMonthKey;
        })
    : [];

  return (
    <div className="app-background">
      <div className="app-container">
        <header className="detail-header">
          <div className="detail-header__nav">
            <Link to={`/${lang}`} className="detail-back">
              <ArrowLeftIcon aria-hidden="true" />
              <span>{t('detail.backToOverview')}</span>
            </Link>
            <Link to={`/${lang}`} className="detail-header__logo">{APP_NAME}</Link>
          </div>
        </header>

        <main className="detail-page">
          <div className="detail-hero">
            <div className="detail-hero__content">
              <div className="header-accent" />
              <h1 className="detail-hero__title">
                {formatCurrency(balance, cur)}
                <span className="detail-hero__rate">@ {formatRate(account.annualInterestRate, cur)}%</span>
              </h1>
              {account.nextPayoutDate && (
                <div className="detail-hero__next-payout">
                  <span className="detail-hero__next-payout-label">{t('accounts.nextPayout')}</span>
                  {account.nextPayoutAmount != null && (
                    <span className="detail-hero__next-payout-amount">{formatCurrency(account.nextPayoutAmount, cur)}</span>
                  )}
                  <span className="detail-hero__next-payout-date">{formatDate(account.nextPayoutDate)}</span>
                </div>
              )}
            </div>
            <div className="detail-hero__actions">
              <button className="btn-action" onClick={handleEdit} aria-label={t('accounts.edit')}>
                <PencilIcon aria-hidden="true" />
                {t('accounts.edit')}
              </button>
              <button
                className={`btn-action btn-action--muted${inPortfolio ? ' btn-action--portfolio-active' : ''}`}
                onClick={() => togglePortfolio(account.id)}
                aria-pressed={inPortfolio}
                aria-label={t('accounts.addToPortfolio')}
              >
                {inPortfolio ? <StarIconSolid aria-hidden="true" /> : <StarIconOutline aria-hidden="true" />}
                {inPortfolio ? t('accounts.removeFromPortfolio') : t('accounts.addToPortfolio')}
              </button>
              <button className="btn-action btn-action--danger" onClick={handleDelete} aria-label={t('accounts.delete')}>
                <XMarkIcon aria-hidden="true" />
                {t('accounts.delete')}
              </button>
            </div>
          </div>

          <section className="detail-properties" aria-label={t('detail.propertiesLabel')}>
            <dl className="detail-properties__grid">
              {properties.map(({ label, value, highlight, badge, info }) => (
                <div key={label} className={`detail-properties__item${highlight ? ' detail-properties__item--highlight' : ''}`}>
                  <dt>{label}</dt>
                  <dd>
                    {badge ? <span className="comparison-badge comparison-badge--ongoing">{badge}</span> : value}
                    {info && (
                      <span className="popover-anchor" tabIndex={0} role="button" aria-label={t('accounts.infoAbout', { label })}>
                        <InformationCircleIcon className="popover-anchor__icon" aria-hidden="true" />
                        <span className="popover-anchor__content">{info}</span>
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {(account.disbursedToDate > 0 || account.accruedInterest > 0) && (
            <section className="detail-status" aria-label={t('detail.statusLabel')}>
              <dl className="detail-status__list">
                {account.disbursedToDate > 0 && (
                  <div className="detail-status__item">
                    <dt>{t('accounts.disbursed')}</dt>
                    <dd>{formatCurrency(account.disbursedToDate, cur)}</dd>
                  </div>
                )}
                {account.accruedInterest > 0 && (
                  <div className="detail-status__item">
                    <dt>{t('accounts.accrued')}</dt>
                    <dd>{formatCurrency(account.accruedInterest, cur)}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {(account.hasCashFlows || account.isVariableRate) && (
            <section className="detail-editors">
              {account.hasCashFlows && (
                <CashFlowEditor
                  cashFlows={account.cashFlows}
                  onUpdate={(cfs) => handleUpdateCashFlows(account.id, cfs)}
                  currency={cur}
                  autoEntries={compoundPayouts}
                />
              )}
              {account.isVariableRate && (
                <RateChangeEditor
                  rateChanges={account.rateChanges}
                  currency={cur}
                  onUpdate={(rcs) => handleUpdateRateChanges(account.id, rcs)}
                />
              )}
            </section>
          )}

          <AccountBalanceChart account={account} currency={cur} />

          {account.startDate && (() => {
            const monthKey = toMonthKey(todayISO());
            const days = getMonthDays(account, monthKey);
            if (days.length === 0) return null;
            return (
              <details className="detail-month-breakdown" aria-label={t('detail.monthBreakdownLabel')}>
                <summary className="detail-collapsible__summary"><h2>{t('detail.monthBreakdownLabel')}</h2><ChevronRightIcon className="detail-collapsible__icon" aria-hidden="true" /></summary>
                <div className="period-table-wrapper">
                  <table className="period-table">
                    <thead>
                      <tr>
                        <th>{t('portfolio.day')}</th>
                        <th>{t('portfolio.balance')}</th>
                        <th>{t('portfolio.ratePercent')}</th>
                        <th>{t('portfolio.dailyInterest')}</th>
                        <th>{t('portfolio.cumulativeInterest')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {days.map((day) => (
                        <tr key={day.date}>
                          <td>{parseDate(day.date).getDate()}</td>
                          <td>{formatCurrency(day.balance, cur)}</td>
                          <td>{formatRate(day.rate, cur)}%</td>
                          <td>{formatCurrency(day.dayInterest, cur)}</td>
                          <td>{formatCurrency(day.cumulative, cur)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            );
          })()}

            <details className="detail-periods" aria-label={t('detail.periodsLabel')}>
              <summary className="detail-collapsible__summary"><h2>{t('accounts.period')}</h2><ChevronRightIcon className="detail-collapsible__icon" aria-hidden="true" /></summary>
              <div className="period-table-wrapper">
                <table className="period-table">
                  <thead>
                    <tr>
                      <th>{t('accounts.period')}</th>
                      <th>{t('accounts.startBalance')}</th>
                      {account.totalDeposited !== 0 && <th>{t('accounts.deposited')}</th>}
                      <th>{t('accounts.interest')}</th>
                      <th>{t('accounts.disbursed')}</th>
                      <th>{t('accounts.endBalance')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {account.periods.map((p, idx) => {
                      const periodStart = idx === 0 ? account.startDate : account.periods[idx - 1].endDate;
                      return (
                        <tr key={p.period}>
                          <td>
                            {p.periodLabel}
                            {periodStart && p.endDate && (
                              <span className="period-table__date">{formatDate(periodStart)} – {formatDate(p.endDate)}</span>
                            )}
                          </td>
                          <td>{formatCurrency(p.startBalance, cur)}</td>
                          {account.totalDeposited !== 0 && (
                            <td className={p.deposited > 0 ? 'text-success' : p.deposited < 0 ? 'text-danger' : ''}>
                              {p.deposited !== 0 ? formatCurrency(p.deposited, cur) : '—'}
                            </td>
                          )}
                          <td>{formatCurrency(p.interestEarned, cur)}</td>
                          <td>{formatCurrency(p.disbursed, cur)}</td>
                          <td>{formatCurrency(idx === account.periods.length - 1 && account.interval === PayoutInterval.AtMaturity ? account.endAmount : p.endBalance, cur)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </details>

        </main>
      </div>
    </div>
  );
}
