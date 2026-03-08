import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import InfoPopover from '../InfoPopover';
import { PayoutInterval, getIntervalLabel } from '../../enums/PayoutInterval';
import { InterestType, getInterestTypeLabel } from '../../enums/InterestType';
import { DayCountConvention, getDayCountLabel, getDayCountDescription } from '../../enums/DayCountConvention';
import { AccountType, getAccountTypeLabel } from '../../enums/AccountType';
import { ACCOUNT_PRESETS, ACCOUNT_RESTRICTIONS } from '../../presets/accountPresets';
import { NoticePeriodUnit, getNoticePeriodUnitLabel } from '../../enums/NoticePeriodUnit';
import { BankAccountInput } from '../../models/BankAccountInput';
import { AccountCalculator } from '../../calculator/AccountCalculator';
import { useLocale } from '../../context/useLocale';
import { SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS, Currency } from '../../enums/Currency';
import type { BankAccount } from '../../models/BankAccount';
import { monthsBetween, daysBetween, todayISO, endOfMonthISO } from '../../utils/date';
import { formatAmountInput, parseAmountInput } from '../../utils/format';
import './AccountForm.css';

interface AccountFormProps {
  onResult: (result: BankAccount) => void;
  editingResult?: BankAccount | null;
  onCancelEdit?: () => void;
}

const calculator = new AccountCalculator();
const intervals = Object.values(PayoutInterval);
const interestTypes = Object.values(InterestType);
const dayCountOptions = Object.values(DayCountConvention);
const accountTypes = Object.values(AccountType);
const noticePeriodUnits = Object.values(NoticePeriodUnit);

interface FormState {
  accountCurrency: Currency | '';
  startAmount: string;
  interestRate: string;
  years: string;
  months: string;
  interval: PayoutInterval;
  interestType: InterestType;
  startDate: string;
  endDate: string;
  isOngoing: boolean;
  dayCount: DayCountConvention;
  isVariableRate: boolean;
  hasCashFlows: boolean;
  useCustomEndDate: boolean;
  accountType: AccountType | '';
  noticePeriodValue: string;
  noticePeriodUnit: NoticePeriodUnit;
  processingDays: string;
  errors: Record<string, string>;
}

function createInitialForm(globalCurrency: Currency): FormState {
  return {
    accountCurrency: '',
    startAmount: formatAmountInput(10000, globalCurrency),
    interestRate: '3.5',
    years: '5',
    months: '0',
    interval: PayoutInterval.Monthly,
    interestType: InterestType.Compound,
    startDate: '',
    endDate: '',
    isOngoing: true,
    dayCount: DayCountConvention.NOM_12,
    isVariableRate: true,
    hasCashFlows: true,
    useCustomEndDate: false,
    accountType: AccountType.Savings,
    noticePeriodValue: '',
    noticePeriodUnit: NoticePeriodUnit.Days,
    processingDays: '',
    errors: {},
  };
}

export default function AccountForm({ onResult, editingResult, onCancelEdit }: AccountFormProps) {
  const { t } = useTranslation();
  const { currency: globalCurrency } = useLocale();
  const [form, setForm] = useState(() => createInitialForm(globalCurrency));
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeCurrency = form.accountCurrency || globalCurrency;

  function updateForm(patch: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function clearError(key: string) {
    setForm((prev) => {
      const { [key]: _, ...rest } = prev.errors;
      return { ...prev, errors: rest };
    });
  }

  const prevEditingId = useState<string | null>(null);
  if (editingResult && editingResult.id !== prevEditingId[0]) {
    prevEditingId[1](editingResult.id);
    setForm({
      startAmount: formatAmountInput(editingResult.startAmount, (editingResult.currency as Currency) || globalCurrency),
      interestRate: editingResult.annualInterestRate.toString(),
      years: Math.floor(editingResult.durationMonths / 12).toString(),
      months: (editingResult.durationMonths % 12).toString(),
      interval: editingResult.interval,
      interestType: editingResult.interestType,
      startDate: editingResult.startDate ?? '',
      endDate: editingResult.endDate ?? '',
      useCustomEndDate: !!editingResult.endDate,
      isOngoing: editingResult.isOngoing,
      dayCount: editingResult.dayCount,
      isVariableRate: editingResult.isVariableRate,
      hasCashFlows: editingResult.hasCashFlows,
      accountCurrency: (editingResult.currency as Currency) ?? '',
      accountType: editingResult.accountType ?? '',
      noticePeriodValue: editingResult.noticePeriodValue?.toString() ?? '',
      noticePeriodUnit: editingResult.noticePeriodUnit ?? NoticePeriodUnit.Days,
      processingDays: editingResult.processingDays?.toString() ?? '',
      errors: {},
    });
  }
  if (!editingResult && prevEditingId[0] !== null) {
    prevEditingId[1](null);
  }

  const restrictions = form.accountType ? ACCOUNT_RESTRICTIONS[form.accountType] : null;
  const isDeposit = form.accountType === AccountType.Deposit;
  const isAdvancedVisible = showAdvanced || !form.accountType;

  const durationFromDates = form.useCustomEndDate && form.startDate && form.endDate ? monthsBetween(form.startDate, form.endDate) : null;
  const hasDurationFromDates = durationFromDates !== null && durationFromDates > 0;

  function applyPreset(type: AccountType) {
    const preset = ACCOUNT_PRESETS[type];
    updateForm({
      accountType: type,
      interestType: preset.interestType,
      interval: preset.interval,
      isOngoing: preset.isOngoing,
      isVariableRate: preset.isVariableRate,
      hasCashFlows: preset.hasCashFlows,
    });
  }

  function validate() {
    const next: Record<string, string> = {};

    const amount = parseAmountInput(form.startAmount, activeCurrency);
    if (!form.startAmount.trim() || isNaN(amount)) {
      next.startAmount = t('form.errorInvalidAmount');
    } else if (amount <= 0) {
      next.startAmount = t('form.errorAmountPositive');
    }

    const rate = parseFloat(form.interestRate.replace(',', '.'));
    if (!form.interestRate.trim() || isNaN(rate)) {
      next.interestRate = t('form.errorInvalidRate');
    } else if (rate < 0) {
      next.interestRate = t('form.errorRateNegative');
    }

    if (isDeposit && !form.startDate) {
      next.startDate = t('form.errorStartDateRequired');
    } else if (form.isOngoing) {
      if (!form.startDate) {
        next.startDate = t('form.errorStartDateRequired');
      }
    } else if (form.useCustomEndDate && form.endDate && !form.startDate) {
      next.endDate = t('form.errorStartDateMissing');
    } else if (form.useCustomEndDate && durationFromDates !== null && durationFromDates <= 0) {
      next.endDate = t('form.errorEndDateBeforeStart');
    } else if (!hasDurationFromDates) {
      const y = parseInt(form.years || '0');
      const m = parseInt(form.months || '0');
      if (isNaN(y) || isNaN(m) || y * 12 + m <= 0) {
        next.duration = t('form.errorMinDuration');
      }
    }

    return next;
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationErrors = validate();
    updateForm({ errors: validationErrors });
    if (Object.keys(validationErrors).length > 0) return;

    const amount = parseAmountInput(form.startAmount, activeCurrency);
    const rate = parseFloat(form.interestRate.replace(',', '.'));
    const durationMonths = form.isOngoing
      ? Math.max(1, Math.ceil(daysBetween(form.startDate, endOfMonthISO(todayISO())) / 30.44) + 12)
      : hasDurationFromDates ? durationFromDates : parseInt(form.years) * 12 + parseInt(form.months || '0');

    const noticePeriodValue = parseInt(form.noticePeriodValue) || undefined;
    const noticePeriodUnit = noticePeriodValue ? form.noticePeriodUnit : undefined;
    const processingDays = parseInt(form.processingDays) || undefined;

    const input = new BankAccountInput(amount, rate, durationMonths, form.interval, form.interestType, form.startDate || undefined, form.hasCashFlows ? (editingResult?.cashFlows ?? []) : [], form.isOngoing, form.dayCount, form.isVariableRate ? (editingResult?.rateChanges ?? []) : [], form.isVariableRate, form.accountCurrency || undefined, form.accountType || undefined, form.hasCashFlows, noticePeriodValue, noticePeriodUnit, processingDays);
    const result = calculator.calculate(input);
    onResult(result);
  }

  function renderDurationFields() {
    return (
      <>
        {!form.isOngoing && !form.useCustomEndDate && (
          <div className="form-group">
            <label className="form-label">{t('form.duration')}</label>
            <div className="form-row">
              <div className="form-input-suffix">
                <input
                  type="number"
                  min="0"
                  max="50"
                  className={`form-input${form.errors.duration ? ' form-input--error' : ''}`}
                  value={form.years}
                  onChange={(e) => { updateForm({ years: e.target.value }); clearError('duration'); }}
                  placeholder="5"
                />
                <span className="suffix">{t('form.yearsSuffix')}</span>
              </div>
              <div className="form-input-suffix">
                <input
                  type="number"
                  min="0"
                  max="11"
                  className={`form-input${form.errors.duration ? ' form-input--error' : ''}`}
                  value={form.months}
                  onChange={(e) => { updateForm({ months: e.target.value }); clearError('duration'); }}
                  placeholder="0"
                />
                <span className="suffix">{t('form.monthsSuffix')}</span>
              </div>
            </div>
            {form.errors.duration && <span className="form-error">{form.errors.duration}</span>}
          </div>
        )}

        {!form.isOngoing && (
          <div className="form-group">
            <div className="form-checkbox">
              <input
                type="checkbox"
                id="useCustomEndDate"
                checked={form.useCustomEndDate}
                onChange={(e) => {
                  updateForm({ useCustomEndDate: e.target.checked, ...(!e.target.checked ? { endDate: '' } : {}) });
                  if (!e.target.checked) clearError('endDate');
                }}
              />
              <label htmlFor="useCustomEndDate">{t('form.useCustomEndDate')}</label>
            </div>
          </div>
        )}

        {!form.isOngoing && form.useCustomEndDate && (
          <div className="form-group">
            <label className="form-label" htmlFor="endDate">
              {t('form.endDate')}
              {hasDurationFromDates && (
                <span className="form-hint">{t('form.durationAuto')}</span>
              )}
            </label>
            <input
              id="endDate"
              type="date"
              className={`form-input${form.errors.endDate ? ' form-input--error' : ''}`}
              value={form.endDate}
              onChange={(e) => { updateForm({ endDate: e.target.value }); clearError('endDate'); }}
            />
            {form.errors.endDate && <span className="form-error">{form.errors.endDate}</span>}
          </div>
        )}
      </>
    );
  }

  return (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="startAmount">{t('form.deposit')}</label>
              <div className="form-input-prefix">
                <span className="prefix">{CURRENCY_SYMBOLS[form.accountCurrency || globalCurrency]}</span>
                <input
                  id="startAmount"
                  type="text"
                  inputMode="decimal"
                  className={`form-input${form.errors.startAmount ? ' form-input--error' : ''}`}
                  value={form.startAmount}
                  onChange={(e) => {
                    updateForm({ startAmount: e.target.value });
                    clearError('startAmount');
                  }}
                  onBlur={() => {
                    const parsed = parseAmountInput(form.startAmount, activeCurrency);
                    if (!isNaN(parsed) && parsed > 0) {
                      updateForm({ startAmount: formatAmountInput(form.startAmount, activeCurrency) });
                    } else {
                      updateForm({ startAmount: '', errors: { ...form.errors, startAmount: t('form.errorInvalidAmount') } });
                    }
                  }}
                  placeholder="10.000"
                />
              </div>
              {form.errors.startAmount && <span className="form-error">{form.errors.startAmount}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="startDate">
                {t('form.startDate')} {form.isOngoing ? '' : t('form.optional')}
              </label>
              <input
                id="startDate"
                type="date"
                className={`form-input${form.errors.startDate ? ' form-input--error' : ''}`}
                value={form.startDate}
                onChange={(e) => { updateForm({ startDate: e.target.value }); clearError('startDate'); }}
              />
              {form.errors.startDate && <span className="form-error">{form.errors.startDate}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="interestRate">{t('form.annualRate')}</label>
              <div className="form-input-suffix">
                <input
                  id="interestRate"
                  type="text"
                  inputMode="decimal"
                  className={`form-input${form.errors.interestRate ? ' form-input--error' : ''}`}
                  value={form.interestRate}
                  onChange={(e) => { updateForm({ interestRate: e.target.value }); clearError('interestRate'); }}
                  placeholder="3,5"
                />
                <span className="suffix">%</span>
              </div>
              {form.errors.interestRate && <span className="form-error">{form.errors.interestRate}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="accountType">
                {t('accountType.label')} {t('form.optional')}
                <span className="form-hint">{t('accountType.hint')}</span>
              </label>
              <select
                id="accountType"
                className="form-input"
                value={form.accountType}
                onChange={(e) => {
                  const value = e.target.value as AccountType | '';
                  if (value) {
                    applyPreset(value);
                    setShowAdvanced(false);
                  } else {
                    updateForm({
                      accountType: '',
                      isOngoing: true,
                      interestType: InterestType.Compound,
                      interval: PayoutInterval.Annually,
                    });
                    setShowAdvanced(true);
                  }
                }}
              >
                <option value="">{t('accountType.placeholder')}</option>
                {accountTypes.map((at) => (
                  <option key={at} value={at}>{getAccountTypeLabel(at)}</option>
                ))}
              </select>
            </div>

            {!isDeposit && (
              <div className="form-group">
                <div className="form-checkbox">
                  <input
                    type="checkbox"
                    id="isOngoing"
                    checked={form.isOngoing}
                    onChange={(e) => updateForm({ isOngoing: e.target.checked })}
                  />
                  <label htmlFor="isOngoing">{t('form.ongoingAccount')}</label>
                </div>
              </div>
            )}

            {!form.isOngoing && renderDurationFields()}

            {form.accountType && (
              <button
                type="button"
                className="advanced-toggle"
                onClick={() => setShowAdvanced(!showAdvanced)}
                aria-expanded={showAdvanced}
                aria-controls="advanced-section"
              >
                <ChevronDownIcon className={`advanced-toggle__icon${showAdvanced ? ' advanced-toggle__icon--open' : ''}`} />
                {t('form.advanced')}
              </button>
            )}

            {isAdvancedVisible && (
              <div id="advanced-section" className="advanced-section">
                {(!restrictions || restrictions.allowVariableRate) && (
                  <div className="form-group">
                    <div className="form-checkbox">
                      <input
                        type="checkbox"
                        id="isVariableRate"
                        checked={form.isVariableRate}
                        onChange={(e) => updateForm({ isVariableRate: e.target.checked })}
                      />
                      <label htmlFor="isVariableRate">
                        {t('form.variableRate')}
                        <span className="form-hint">{t('form.variableRateHint')}</span>
                      </label>
                    </div>
                  </div>
                )}

                {(!restrictions || restrictions.allowCashFlows) && (
                  <div className="form-group">
                    <div className="form-checkbox">
                      <input
                        type="checkbox"
                        id="hasCashFlows"
                        checked={form.hasCashFlows}
                        onChange={(e) => updateForm({ hasCashFlows: e.target.checked })}
                      />
                      <label htmlFor="hasCashFlows">
                        {t('form.cashFlows')}
                        <span className="form-hint">{t('form.cashFlowsHint')}</span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">{t('form.interestType')}</label>
                  <div className="interval-grid">
                    {interestTypes.map((rt) => (
                      <div key={rt} className="interval-option">
                        <input
                          type="radio"
                          name="interestType"
                          id={`interest-type-${rt}`}
                          value={rt}
                          checked={form.interestType === rt}
                          onChange={() => updateForm({ interestType: rt })}
                        />
                        <label htmlFor={`interest-type-${rt}`}>
                          {getInterestTypeLabel(rt)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('form.payoutLabel')}</label>
                  <div className="interval-grid">
                    {intervals.map((iv) => (
                      <div
                        key={iv}
                        className="interval-option"
                      >
                        <input
                          type="radio"
                          name="interval"
                          id={`interval-${iv}`}
                          value={iv}
                          checked={form.interval === iv}
                          onChange={() => updateForm({ interval: iv })}
                        />
                        <label htmlFor={`interval-${iv}`}>
                          {getIntervalLabel(iv)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t('form.dayCountConvention')}
                    <span className="form-hint">{t('form.dayCountHint')}</span>
                  </label>
                  <div className="interval-grid">
                    {dayCountOptions.map((dc) => (
                      <div key={dc} className="interval-option">
                        <input
                          type="radio"
                          name="dayCount"
                          id={`daycount-${dc}`}
                          value={dc}
                          checked={form.dayCount === dc}
                          onChange={() => updateForm({ dayCount: dc })}
                        />
                        <label htmlFor={`daycount-${dc}`}>
                          {getDayCountLabel(dc)}
                          <InfoPopover label={t('accounts.infoAbout', { label: getDayCountLabel(dc) })} onClick={(e) => e.preventDefault()}>{getDayCountDescription(dc)}</InfoPopover>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="accountCurrency">
                    {t('currency.label')} {t('form.optional')}
                  </label>
                  <select
                    id="accountCurrency"
                    className="form-input"
                    value={form.accountCurrency}
                    onChange={(e) => updateForm({ accountCurrency: e.target.value as Currency | '' })}
                  >
                    <option value="">{t('currency.defaultOption', { code: globalCurrency })}</option>
                    {SUPPORTED_CURRENCIES.map((code) => (
                      <option key={code} value={code}>
                        {CURRENCY_SYMBOLS[code]} {code}
                      </option>
                    ))}
                  </select>
                </div>

                <fieldset className="form-fieldset">
                  <legend className="form-label">
                    {t('transferSettings.title')} {t('form.optional')}
                  </legend>

                  <div className="form-group">
                    <label className="form-label" htmlFor="noticePeriodValue">
                      {t('transferSettings.noticePeriod')}
                      <span className="form-hint">{t('transferSettings.noticePeriodHint')}</span>
                    </label>
                    <div className="form-row">
                      <div className="form-input-suffix">
                        <input
                          id="noticePeriodValue"
                          type="number"
                          min="0"
                          className="form-input"
                          value={form.noticePeriodValue}
                          onChange={(e) => updateForm({ noticePeriodValue: e.target.value })}
                          placeholder="0"
                        />
                        <span className="suffix">{form.noticePeriodUnit === NoticePeriodUnit.Months ? t('form.monthsSuffix') : t('transferSettings.daysSuffix')}</span>
                      </div>
                      <select
                        id="noticePeriodUnit"
                        className="form-input"
                        value={form.noticePeriodUnit}
                        onChange={(e) => updateForm({ noticePeriodUnit: e.target.value as NoticePeriodUnit })}
                        aria-label={t('transferSettings.noticePeriodUnit')}
                      >
                        {noticePeriodUnits.map((u) => (
                          <option key={u} value={u}>{getNoticePeriodUnitLabel(u)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="processingDays">
                      {t('transferSettings.processingDays')}
                      <span className="form-hint">{t('transferSettings.processingDaysHint')}</span>
                    </label>
                    <div className="form-input-suffix">
                      <input
                        id="processingDays"
                        type="number"
                        min="0"
                        className="form-input"
                        value={form.processingDays}
                        onChange={(e) => updateForm({ processingDays: e.target.value })}
                        placeholder="0"
                      />
                      <span className="suffix">{t('transferSettings.businessDaysSuffix')}</span>
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            <button type="submit" className="btn-primary">
              {editingResult ? t('form.update') : t('form.calculate')}
            </button>
            {onCancelEdit && (
              <button type="button" className="btn-secondary" onClick={onCancelEdit}>
                {t('form.cancel')}
              </button>
            )}
          </form>
  );
}
