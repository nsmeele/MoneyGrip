import { useState } from 'react';
import { PayoutInterval, INTERVAL_LABELS } from '../enums/PayoutInterval';
import { RenteType, RENTE_TYPE_LABELS } from '../enums/RenteType';
import { InterestCalculationInput } from '../models/InterestCalculationInput';
import { InterestCalculator } from '../calculator/InterestCalculator';
import type { InterestCalculationResult } from '../models/InterestCalculationResult';

interface CalculatorFormProps {
  onResult: (result: InterestCalculationResult) => void;
  editingResult?: InterestCalculationResult | null;
  onCancelEdit?: () => void;
}

const calculator = new InterestCalculator();

const intervals = Object.values(PayoutInterval);
const renteTypes = Object.values(RenteType);

export default function CalculatorForm({ onResult, editingResult, onCancelEdit }: CalculatorFormProps) {
  const [startBedrag, setStartBedrag] = useState('10000');
  const [rentePercentage, setRentePercentage] = useState('3.5');
  const [jaren, setJaren] = useState('5');
  const [maanden, setMaanden] = useState('0');
  const [interval, setInterval] = useState<PayoutInterval>(PayoutInterval.PerJaar);
  const [renteType, setRenteType] = useState<RenteType>(RenteType.Samengesteld);
  const [startDatum, setStartDatum] = useState('');

  const prevEditingId = useState<string | null>(null);
  if (editingResult && editingResult.id !== prevEditingId[0]) {
    prevEditingId[1](editingResult.id);
    setStartBedrag(editingResult.startBedrag.toString());
    setRentePercentage(editingResult.jaarRentePercentage.toString());
    setJaren(Math.floor(editingResult.looptijdMaanden / 12).toString());
    setMaanden((editingResult.looptijdMaanden % 12).toString());
    setInterval(editingResult.interval);
    setRenteType(editingResult.renteType);
    setStartDatum(editingResult.startDatum ?? '');
  }
  if (!editingResult && prevEditingId[0] !== null) {
    prevEditingId[1](null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const bedrag = parseFloat(startBedrag.replace(/\./g, '').replace(',', '.'));
    const rente = parseFloat(rentePercentage.replace(',', '.'));
    const looptijdMaanden = parseInt(jaren) * 12 + parseInt(maanden || '0');

    if (isNaN(bedrag) || isNaN(rente) || looptijdMaanden <= 0) return;

    const input = new InterestCalculationInput(bedrag, rente, looptijdMaanden, interval, renteType, startDatum || undefined);
    const result = calculator.calculate(input);
    onResult(result);
  }

  return (
    <div className="form-sticky">
      <div className="card">
        <div className="card-header">
          <h2>Berekening</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="startBedrag">Startbedrag</label>
              <div className="form-input-prefix">
                <span className="prefix">&euro;</span>
                <input
                  id="startBedrag"
                  type="text"
                  inputMode="decimal"
                  className="form-input"
                  value={startBedrag}
                  onChange={(e) => setStartBedrag(e.target.value)}
                  placeholder="10.000"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="rentePercentage">Jaarlijks rentepercentage</label>
              <div className="form-input-suffix">
                <input
                  id="rentePercentage"
                  type="text"
                  inputMode="decimal"
                  className="form-input"
                  value={rentePercentage}
                  onChange={(e) => setRentePercentage(e.target.value)}
                  placeholder="3,5"
                />
                <span className="suffix">%</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Looptijd</label>
              <div className="form-row">
                <div className="form-input-suffix">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    className="form-input"
                    value={jaren}
                    onChange={(e) => setJaren(e.target.value)}
                    placeholder="5"
                  />
                  <span className="suffix">jr</span>
                </div>
                <div className="form-input-suffix">
                  <input
                    type="number"
                    min="0"
                    max="11"
                    className="form-input"
                    value={maanden}
                    onChange={(e) => setMaanden(e.target.value)}
                    placeholder="0"
                  />
                  <span className="suffix">mnd</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="startDatum">Startdatum (optioneel)</label>
              <input
                id="startDatum"
                type="date"
                className="form-input"
                value={startDatum}
                onChange={(e) => setStartDatum(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Rentetype</label>
              <div className="interval-grid">
                {renteTypes.map((rt) => (
                  <div key={rt} className="interval-option">
                    <input
                      type="radio"
                      name="renteType"
                      id={`rente-type-${rt}`}
                      value={rt}
                      checked={renteType === rt}
                      onChange={() => setRenteType(rt)}
                    />
                    <label htmlFor={`rente-type-${rt}`}>
                      {RENTE_TYPE_LABELS[rt]}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Uitbetalingsinterval</label>
              <div className="interval-grid">
                {intervals.map((iv) => (
                  <div
                    key={iv}
                    className={`interval-option${iv === PayoutInterval.Deposito ? ' interval-option--wide' : ''}`}
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
              {editingResult ? 'Bijwerken' : 'Bereken rente'}
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
