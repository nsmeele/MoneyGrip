import { useState } from 'react';
import { PayoutInterval, INTERVAL_LABELS } from '../enums/PayoutInterval';
import { InterestType, INTEREST_TYPE_LABELS } from '../enums/InterestType';
import { BankAccountInput } from '../models/BankAccountInput';
import { AccountCalculator } from '../calculator/AccountCalculator';
import type { BankAccount } from '../models/BankAccount';
import { monthsBetween, todayISO } from '../utils/date';

interface AccountFormProps {
  onResult: (result: BankAccount) => void;
  editingResult?: BankAccount | null;
  onCancelEdit?: () => void;
}

const calculator = new AccountCalculator();
const intervals = Object.values(PayoutInterval);
const interestTypes = Object.values(InterestType);

export default function AccountForm({ onResult, editingResult, onCancelEdit }: AccountFormProps) {
  const [startAmount, setStartAmount] = useState('10000');
  const [interestRate, setInterestRate] = useState('3.5');
  const [years, setYears] = useState('5');
  const [months, setMonths] = useState('0');
  const [interval, setInterval] = useState<PayoutInterval>(PayoutInterval.Annually);
  const [interestType, setInterestType] = useState<InterestType>(InterestType.Compound);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isOngoing, setIsOngoing] = useState(true);

  const prevEditingId = useState<string | null>(null);
  if (editingResult && editingResult.id !== prevEditingId[0]) {
    prevEditingId[1](editingResult.id);
    setStartAmount(editingResult.startAmount.toString());
    setInterestRate(editingResult.annualInterestRate.toString());
    setYears(Math.floor(editingResult.durationMonths / 12).toString());
    setMonths((editingResult.durationMonths % 12).toString());
    setInterval(editingResult.interval);
    setInterestType(editingResult.interestType);
    setStartDate(editingResult.startDate ?? '');
    setEndDate(editingResult.endDate ?? '');
    setIsOngoing(editingResult.isOngoing);
  }
  if (!editingResult && prevEditingId[0] !== null) {
    prevEditingId[1](null);
  }

  const durationFromDates = startDate && endDate ? monthsBetween(startDate, endDate) : null;
  const hasDurationFromDates = durationFromDates !== null && durationFromDates > 0;

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const next: Record<string, string> = {};

    const amount = parseFloat(startAmount.replace(/\./g, '').replace(',', '.'));
    if (!startAmount.trim() || isNaN(amount)) {
      next.startAmount = 'Vul een geldig bedrag in';
    } else if (amount <= 0) {
      next.startAmount = 'Bedrag moet hoger zijn dan 0';
    }

    const rate = parseFloat(interestRate.replace(',', '.'));
    if (!interestRate.trim() || isNaN(rate)) {
      next.interestRate = 'Vul een geldig percentage in';
    } else if (rate < 0) {
      next.interestRate = 'Percentage kan niet negatief zijn';
    }

    if (isOngoing) {
      if (!startDate) {
        next.startDate = 'Vul een startdatum in voor een lopende rekening';
      }
    } else if (endDate && !startDate) {
      next.endDate = 'Vul ook een startdatum in';
    } else if (durationFromDates !== null && durationFromDates <= 0) {
      next.endDate = 'Einddatum moet na de startdatum liggen';
    } else if (!hasDurationFromDates) {
      const y = parseInt(years || '0');
      const m = parseInt(months || '0');
      if (isNaN(y) || isNaN(m) || y * 12 + m <= 0) {
        next.duration = 'Looptijd moet minimaal 1 maand zijn';
      }
    }

    return next;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const amount = parseFloat(startAmount.replace(/\./g, '').replace(',', '.'));
    const rate = parseFloat(interestRate.replace(',', '.'));
    const durationMonths = isOngoing
      ? Math.max(1, monthsBetween(startDate, todayISO()))
      : hasDurationFromDates ? durationFromDates : parseInt(years) * 12 + parseInt(months || '0');

    const input = new BankAccountInput(amount, rate, durationMonths, interval, interestType, startDate || undefined, editingResult?.cashFlows ?? [], isOngoing);
    const result = calculator.calculate(input);
    onResult(result);
  }

  return (
    <div className="form-sticky">
      <div className="card">
        <div className="card-header">
          <h2>{editingResult ? 'Rekening aanpassen' : 'Nieuwe rekening'}</h2>
          <p>{editingResult ? 'Pas de waarden aan en klik op bijwerken.' : 'Vul de gegevens van je spaarrekening in.'}</p>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="startAmount">Inleg</label>
              <div className="form-input-prefix">
                <span className="prefix">&euro;</span>
                <input
                  id="startAmount"
                  type="text"
                  inputMode="decimal"
                  className={`form-input${errors.startAmount ? ' form-input--error' : ''}`}
                  value={startAmount}
                  onChange={(e) => { setStartAmount(e.target.value); setErrors((p) => { const { startAmount: _, ...rest } = p; return rest; }); }}
                  placeholder="10.000"
                />
              </div>
              {errors.startAmount && <span className="form-error">{errors.startAmount}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="startDate">
                Startdatum {isOngoing ? '' : '(optioneel)'}
              </label>
              <input
                id="startDate"
                type="date"
                className={`form-input${errors.startDate ? ' form-input--error' : ''}`}
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setErrors((p) => { const { startDate: _, ...rest } = p; return rest; }); }}
              />
              {errors.startDate && <span className="form-error">{errors.startDate}</span>}
            </div>

            <div className="form-group">
              <div className="form-checkbox">
                <input
                  type="checkbox"
                  id="isOngoing"
                  checked={isOngoing}
                  onChange={(e) => setIsOngoing(e.target.checked)}
                />
                <label htmlFor="isOngoing">Lopende rekening (geen einddatum)</label>
              </div>
            </div>

            {!isOngoing && (
              <div className="form-group">
                <label className="form-label" htmlFor="endDate">
                  Einddatum (optioneel)
                  {hasDurationFromDates && (
                    <span className="form-hint">Looptijd wordt automatisch berekend</span>
                  )}
                </label>
                <input
                  id="endDate"
                  type="date"
                  className={`form-input${errors.endDate ? ' form-input--error' : ''}`}
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setErrors((p) => { const { endDate: _e, ...rest } = p; return rest; }); }}
                />
                {errors.endDate && <span className="form-error">{errors.endDate}</span>}
              </div>
            )}

            {!isOngoing && (
              <div className="form-group">
                <label className="form-label">Looptijd</label>
                <div className="form-row">
                  <div className="form-input-suffix">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      className={`form-input${errors.duration ? ' form-input--error' : ''}${hasDurationFromDates ? ' form-input--derived' : ''}`}
                      value={hasDurationFromDates ? Math.floor(durationFromDates / 12) : years}
                      onChange={(e) => { setYears(e.target.value); setErrors((p) => { const { duration: _, ...rest } = p; return rest; }); }}
                      placeholder="5"
                      readOnly={hasDurationFromDates}
                      tabIndex={hasDurationFromDates ? -1 : undefined}
                    />
                    <span className="suffix">jr</span>
                  </div>
                  <div className="form-input-suffix">
                    <input
                      type="number"
                      min="0"
                      max="11"
                      className={`form-input${errors.duration ? ' form-input--error' : ''}${hasDurationFromDates ? ' form-input--derived' : ''}`}
                      value={hasDurationFromDates ? durationFromDates % 12 : months}
                      onChange={(e) => { setMonths(e.target.value); setErrors((p) => { const { duration: _, ...rest } = p; return rest; }); }}
                      placeholder="0"
                      readOnly={hasDurationFromDates}
                      tabIndex={hasDurationFromDates ? -1 : undefined}
                    />
                    <span className="suffix">mnd</span>
                  </div>
                </div>
                {errors.duration && <span className="form-error">{errors.duration}</span>}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="interestRate">Rente per jaar</label>
              <div className="form-input-suffix">
                <input
                  id="interestRate"
                  type="text"
                  inputMode="decimal"
                  className={`form-input${errors.interestRate ? ' form-input--error' : ''}`}
                  value={interestRate}
                  onChange={(e) => { setInterestRate(e.target.value); setErrors((p) => { const { interestRate: _, ...rest } = p; return rest; }); }}
                  placeholder="3,5"
                />
                <span className="suffix">%</span>
              </div>
              {errors.interestRate && <span className="form-error">{errors.interestRate}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Rentetype</label>
              <div className="interval-grid">
                {interestTypes.map((rt) => (
                  <div key={rt} className="interval-option">
                    <input
                      type="radio"
                      name="interestType"
                      id={`interest-type-${rt}`}
                      value={rt}
                      checked={interestType === rt}
                      onChange={() => setInterestType(rt)}
                    />
                    <label htmlFor={`interest-type-${rt}`}>
                      {INTEREST_TYPE_LABELS[rt]}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Uitbetaling</label>
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
                      checked={interval === iv}
                      onChange={() => setInterval(iv)}
                    />
                    <label htmlFor={`interval-${iv}`}>
                      {INTERVAL_LABELS[iv]}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary">
              {editingResult ? 'Bijwerken' : 'Bereken'}
            </button>
            {editingResult && onCancelEdit && (
              <button type="button" className="btn-secondary" onClick={onCancelEdit}>
                Annuleren
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
