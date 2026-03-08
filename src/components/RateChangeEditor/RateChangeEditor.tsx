import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, XMarkIcon, PencilIcon } from '@heroicons/react/24/outline';
import type { RateChange } from '../../models/RateChange';
import { formatDate, formatRate } from '../../utils/format';
import type { Currency } from '../../enums/Currency';
import { INITIAL_FORM, rateChangeToFormState } from './rateChangeFormState';
import type { FormMode } from '../../types/FormMode';
import './RateChangeEditor.css';

interface RateChangeEditorProps {
  rateChanges: RateChange[];
  currency: Currency;
  onUpdate: (rateChanges: RateChange[]) => void;
}

export default function RateChangeEditor({ rateChanges, currency, onUpdate }: RateChangeEditorProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<FormMode>({ status: 'idle' });
  const [form, setForm] = useState(INITIAL_FORM);

  function updateField(field: string, value: string) {
    setForm((prev) => {
      const { [field]: _, ...restErrors } = prev.errors;
      return { ...prev, [field]: value, errors: restErrors };
    });
  }

  function handleEdit(rc: RateChange) {
    setForm(rateChangeToFormState(rc));
    setMode({ status: 'editing', id: rc.id });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.date) errors.date = t('rateChange.errorDate');
    const parsedRate = parseFloat(form.rate.replace(',', '.'));
    if (!form.rate || isNaN(parsedRate) || parsedRate < 0) errors.rate = t('rateChange.errorRate');
    if (Object.keys(errors).length > 0) { setForm((prev) => ({ ...prev, errors })); return; }

    const rateChange: RateChange = {
      id: mode.status === 'editing' ? mode.id : crypto.randomUUID(),
      date: form.date,
      annualInterestRate: parsedRate,
    };

    const updated = mode.status === 'editing'
      ? rateChanges.map((rc) => rc.id === mode.id ? rateChange : rc)
      : [...rateChanges, rateChange];

    onUpdate(updated.sort((a, b) => a.date.localeCompare(b.date)));
    setForm(INITIAL_FORM);
    setMode({ status: 'idle' });
  }

  function handleRemove(id: string) {
    onUpdate(rateChanges.filter((rc) => rc.id !== id));
  }

  const sorted = [...rateChanges].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="rate-change-editor">
      <div className="rate-change-editor__header">
        <h3>{t('rateChange.title')}</h3>
        <button
          className={`rate-change-editor__add-btn${mode.status === 'adding' ? ' rate-change-editor__add-btn--active' : ''}`}
          onClick={() => {
            if (mode.status === 'idle') {
              setMode({ status: 'adding' });
            } else {
              setForm(INITIAL_FORM);
              setMode({ status: 'idle' });
            }
          }}
        >
          {mode.status !== 'idle' ? t('rateChange.cancel') : <><PlusIcon aria-hidden="true" /> {t('rateChange.add')}</>}
        </button>
      </div>

      {mode.status !== 'idle' && (
        <form className="rate-change-editor__form" onSubmit={handleSubmit}>
          <div className="rate-change-editor__fields">
            <div>
              <label className="form-label" htmlFor="rc-date">{t('rateChange.effectiveDate')}</label>
              <input
                id="rc-date"
                type="date"
                className={`form-input${form.errors.date ? ' form-input--error' : ''}`}
                value={form.date}
                onChange={(e) => updateField('date', e.target.value)}
              />
              {form.errors.date && <span className="form-error">{form.errors.date}</span>}
            </div>
            <div>
              <label className="form-label" htmlFor="rc-rate">{t('rateChange.newRate')}</label>
              <div className="form-input-suffix">
                <input
                  id="rc-rate"
                  type="text"
                  inputMode="decimal"
                  className={`form-input${form.errors.rate ? ' form-input--error' : ''}`}
                  value={form.rate}
                  onChange={(e) => updateField('rate', e.target.value)}
                  placeholder="3,5"
                />
                <span className="suffix">%</span>
              </div>
              {form.errors.rate && <span className="form-error">{form.errors.rate}</span>}
            </div>
          </div>

          <div className="rate-change-editor__actions">
            <button
              type="submit"
              className="rate-change-editor__submit"
            >
              {mode.status === 'editing' ? t('rateChange.save') : t('rateChange.add')}
            </button>
          </div>
        </form>
      )}

      {sorted.length === 0 && mode.status === 'idle' && (
        <div className="rate-change-editor__empty">{t('rateChange.empty')}</div>
      )}

      {sorted.length > 0 && (
        <div className="rate-change-editor__list">
          {sorted.map((rc) => (
            <div key={rc.id} className="rate-change-item">
              <span className="rate-change-item__date">{formatDate(rc.date)}</span>
              <span className="rate-change-item__rate">{formatRate(rc.annualInterestRate, currency)}%</span>
              <button
                className="btn-icon btn-icon--edit"
                title={t('rateChange.edit')}
                onClick={() => handleEdit(rc)}
                aria-label={t('rateChange.editRateChange', { date: formatDate(rc.date) })}
              >
                <PencilIcon aria-hidden="true" />
              </button>
              <button
                className="btn-icon"
                title={t('rateChange.delete')}
                onClick={() => handleRemove(rc.id)}
                aria-label={t('rateChange.deleteRateChange', { date: formatDate(rc.date) })}
              >
                <XMarkIcon aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
