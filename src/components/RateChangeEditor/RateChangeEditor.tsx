import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { RateChange } from '../../models/RateChange';
import { formatDate, formatRate } from '../../utils/format';
import type { Currency } from '../../enums/Currency';
import './RateChangeEditor.css';

interface RateChangeEditorProps {
  rateChanges: RateChange[];
  currency: Currency;
  onUpdate: (rateChanges: RateChange[]) => void;
}

export default function RateChangeEditor({ rateChanges, currency, onUpdate }: RateChangeEditorProps) {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [date, setDate] = useState('');
  const [rate, setRate] = useState('');

  function resetForm() {
    setDate('');
    setRate('');
  }

  function handleAdd() {
    const parsedRate = parseFloat(rate.replace(',', '.'));
    if (!date || isNaN(parsedRate) || parsedRate < 0) return;

    const newRateChange: RateChange = {
      id: crypto.randomUUID(),
      date,
      annualInterestRate: parsedRate,
    };

    onUpdate([...rateChanges, newRateChange].sort((a, b) => a.date.localeCompare(b.date)));
    resetForm();
    setIsAdding(false);
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
          className={`rate-change-editor__add-btn${isAdding ? ' rate-change-editor__add-btn--active' : ''}`}
          onClick={() => { setIsAdding(!isAdding); if (isAdding) resetForm(); }}
        >
          {isAdding ? t('rateChange.cancel') : <><PlusIcon aria-hidden="true" /> {t('rateChange.add')}</>}
        </button>
      </div>

      {isAdding && (
        <div className="rate-change-editor__form">
          <div className="rate-change-editor__fields">
            <div>
              <label className="form-label" htmlFor="rc-date">{t('rateChange.effectiveDate')}</label>
              <input
                id="rc-date"
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="rc-rate">{t('rateChange.newRate')}</label>
              <div className="form-input-suffix">
                <input
                  id="rc-rate"
                  type="text"
                  inputMode="decimal"
                  className="form-input"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="3,5"
                />
                <span className="suffix">%</span>
              </div>
            </div>
          </div>

          <div className="rate-change-editor__actions">
            <button
              type="button"
              className="rate-change-editor__submit"
              onClick={handleAdd}
            >
              {t('rateChange.add')}
            </button>
          </div>
        </div>
      )}

      {sorted.length === 0 && !isAdding && (
        <div className="rate-change-editor__empty">{t('rateChange.empty')}</div>
      )}

      {sorted.length > 0 && (
        <div className="rate-change-editor__list">
          {sorted.map((rc) => (
            <div key={rc.id} className="rate-change-item">
              <span className="rate-change-item__date">{formatDate(rc.date)}</span>
              <span className="rate-change-item__rate">{formatRate(rc.annualInterestRate, currency)}%</span>
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
