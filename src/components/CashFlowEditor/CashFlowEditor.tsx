import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { CashFlow } from '../../models/CashFlow';
import { formatCurrency, formatDate } from '../../utils/format';
import { CURRENCY_SYMBOLS, type Currency } from '../../enums/Currency';
import './CashFlowEditor.css';

export interface AutoCashFlow {
  date: string;
  amount: number;
  description: string;
}

interface CashFlowEditorProps {
  cashFlows: CashFlow[];
  onUpdate: (cashFlows: CashFlow[]) => void;
  currency: string;
  autoEntries?: AutoCashFlow[];
}

const INITIAL_FORM = {
  isWithdrawal: false, date: '', amount: '', description: '',
  isRecurring: false, intervalMonths: 1,
};

export default function CashFlowEditor({ cashFlows, onUpdate, currency, autoEntries = [] }: CashFlowEditorProps) {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const recurringOptions = [
    { value: 1, label: t('cashflow.recurringMonthly') },
    { value: 3, label: t('cashflow.recurringQuarterly') },
    { value: 6, label: t('cashflow.recurringSemiAnnually') },
    { value: 12, label: t('cashflow.recurringAnnually') },
  ];

  function handleAdd() {
    const parsedAmount = parseFloat(form.amount.replace(',', '.'));
    if (!form.date || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newCashFlow: CashFlow = {
      id: crypto.randomUUID(),
      date: form.date,
      amount: form.isWithdrawal ? -parsedAmount : parsedAmount,
      description: form.description || (form.isWithdrawal ? t('cashflow.withdrawalType') : t('cashflow.depositType')),
      ...(form.isRecurring ? { recurring: { intervalMonths: form.intervalMonths } } : {}),
    };

    onUpdate([...cashFlows, newCashFlow].sort((a, b) => a.date.localeCompare(b.date)));
    setForm(INITIAL_FORM);
    setIsAdding(false);
  }

  function handleRemove(id: string) {
    onUpdate(cashFlows.filter((cf) => cf.id !== id));
  }

  type DisplayEntry =
    | { type: 'manual'; cf: CashFlow }
    | { type: 'auto'; entry: AutoCashFlow };

  const allEntries: DisplayEntry[] = [
    ...cashFlows.map((cf): DisplayEntry => ({ type: 'manual', cf })),
    ...autoEntries.map((entry): DisplayEntry => ({ type: 'auto', entry })),
  ].sort((a, b) => {
    const dateA = a.type === 'manual' ? a.cf.date : a.entry.date;
    const dateB = b.type === 'manual' ? b.cf.date : b.entry.date;
    return dateB.localeCompare(dateA);
  });

  return (
    <div className="cashflow-editor">
      <div className="cashflow-editor__header">
        <h3>{t('cashflow.title')}</h3>
        <button
          className={`cashflow-editor__add-btn${isAdding ? ' cashflow-editor__add-btn--active' : ''}`}
          onClick={() => { setIsAdding(!isAdding); if (isAdding) setForm(INITIAL_FORM); }}
        >
          {isAdding ? t('cashflow.cancel') : <><PlusIcon aria-hidden="true" /> {t('cashflow.add')}</>}
        </button>
      </div>

      {isAdding && (
        <div className="cashflow-editor__form">
          <div className="cashflow-editor__type-toggle">
            <button
              type="button"
              className={`cashflow-type${!form.isWithdrawal ? ' cashflow-type--active cashflow-type--deposit' : ''}`}
              onClick={() => setForm((prev) => ({ ...prev, isWithdrawal: false }))}
            >
              {t('cashflow.depositType')}
            </button>
            <button
              type="button"
              className={`cashflow-type${form.isWithdrawal ? ' cashflow-type--active cashflow-type--withdrawal' : ''}`}
              onClick={() => setForm((prev) => ({ ...prev, isWithdrawal: true }))}
            >
              {t('cashflow.withdrawalType')}
            </button>
          </div>

          <div className="cashflow-editor__fields">
            <div>
              <label className="form-label" htmlFor="cf-date">{t('cashflow.date')}</label>
              <input
                id="cf-date"
                type="date"
                className="form-input"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="cf-amount">{t('cashflow.amount')}</label>
              <div className="form-input-prefix">
                <span className="prefix">{CURRENCY_SYMBOLS[currency as Currency] ?? currency}</span>
                <input
                  id="cf-amount"
                  type="text"
                  inputMode="decimal"
                  className="form-input"
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
            </div>
            <div>
              <label className="form-label" htmlFor="cf-desc">{t('cashflow.description')}</label>
              <input
                id="cf-desc"
                type="text"
                className="form-input"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder={form.isWithdrawal ? t('cashflow.withdrawalType') : t('cashflow.depositType')}
              />
            </div>
          </div>

          <div className="cashflow-editor__recurring">
            <label className="cashflow-editor__recurring-label">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(e) => setForm((prev) => ({ ...prev, isRecurring: e.target.checked }))}
              />
              {t('cashflow.recurring')}
            </label>
            {form.isRecurring && (
              <select
                className="cashflow-editor__recurring-select"
                value={form.intervalMonths}
                onChange={(e) => setForm((prev) => ({ ...prev, intervalMonths: Number(e.target.value) }))}
              >
                {recurringOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
          </div>

          <div className="cashflow-editor__actions">
            <button
              type="button"
              className="cashflow-editor__submit"
              onClick={handleAdd}
            >
              {t('cashflow.add')}
            </button>
          </div>
        </div>
      )}

      {allEntries.length === 0 && !isAdding && (
        <div className="cashflow-editor__empty">{t('cashflow.empty')}</div>
      )}

      {allEntries.length > 0 && (
        <div className="cashflow-editor__list">
          {allEntries.map((entry) => {
            if (entry.type === 'auto') {
              const { date: d, amount: amt, description: desc } = entry.entry;
              return (
                <div key={`auto-${d}`} className="cashflow-item cashflow-item--auto">
                  <span className="cashflow-item__date">{formatDate(d)}</span>
                  <span className="cashflow-item__desc">
                    {desc}
                    <span className="cashflow-item__badge cashflow-item__badge--auto">{t('cashflow.automatic')}</span>
                  </span>
                  <span className="cashflow-item__amount cashflow-item__amount--deposit">
                    +{formatCurrency(amt, currency)}
                  </span>
                  <span className="btn-icon-spacer" />
                </div>
              );
            }
            const cf = entry.cf;
            return (
              <div key={cf.id} className="cashflow-item">
                <span className="cashflow-item__date">{formatDate(cf.date)}</span>
                <span className="cashflow-item__desc">
                  {cf.description}
                  {cf.recurring && (
                    <span className="cashflow-item__badge">
                      {recurringOptions.find((o) => o.value === cf.recurring!.intervalMonths)?.label ?? t('cashflow.recurring')}
                    </span>
                  )}
                </span>
                <span className={`cashflow-item__amount${cf.amount >= 0 ? ' cashflow-item__amount--deposit' : ' cashflow-item__amount--withdrawal'}`}>
                  {cf.amount >= 0 ? '+' : '\u2212'}{formatCurrency(Math.abs(cf.amount), currency)}
                </span>
                <button
                  className="btn-icon"
                  title={t('cashflow.delete')}
                  onClick={() => handleRemove(cf.id)}
                  aria-label={t('cashflow.deleteTransaction', { description: cf.description })}
                >
                  <XMarkIcon aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
