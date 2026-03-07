import { PayoutInterval } from '../enums/PayoutInterval';
import { InterestType } from '../enums/InterestType';
import { Currency } from '../enums/Currency';
import { EXPORT_FORMAT_VERSION } from '../models/ExportFile';
import type { ExportFile, ExportedResult } from '../models/ExportFile';

export type ValidationResult =
  | { ok: true; data: ExportFile }
  | { ok: false; error: string };

const PAYOUT_INTERVAL_VALUES = Object.values(PayoutInterval) as string[];
const INTEREST_TYPE_VALUES = Object.values(InterestType) as string[];
const CURRENCY_VALUES = Object.values(Currency) as string[];
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function validatePeriodResult(value: unknown, index: number): string | null {
  if (!isObject(value)) return `Periode ${index + 1}: geen geldig object.`;
  const p = value as Record<string, unknown>;

  if (!isFiniteNumber(p.period)) return `Periode ${index + 1}: 'period' is geen geldig getal.`;
  if (typeof p.periodLabel !== 'string') return `Periode ${index + 1}: 'periodLabel' is geen tekst.`;
  if (!isFiniteNumber(p.startBalance)) return `Periode ${index + 1}: 'startBalance' is geen geldig getal.`;
  if (!isFiniteNumber(p.interestEarned)) return `Periode ${index + 1}: 'interestEarned' is geen geldig getal.`;
  if (!isFiniteNumber(p.disbursed)) return `Periode ${index + 1}: 'disbursed' is geen geldig getal.`;
  if (!isFiniteNumber(p.endBalance)) return `Periode ${index + 1}: 'endBalance' is geen geldig getal.`;
  if (p.deposited !== undefined && !isFiniteNumber(p.deposited)) return `Periode ${index + 1}: 'deposited' is geen geldig getal.`;

  return null;
}

function validateCashFlow(value: unknown, index: number): string | null {
  if (!isObject(value)) return `Kasbeweging ${index + 1}: geen geldig object.`;
  const cf = value as Record<string, unknown>;

  if (!isNonEmptyString(cf.id)) return `Kasbeweging ${index + 1}: 'id' ontbreekt.`;
  if (typeof cf.date !== 'string' || !ISO_DATE_REGEX.test(cf.date)) return `Kasbeweging ${index + 1}: 'date' is geen geldige datum (YYYY-MM-DD).`;
  if (!isFiniteNumber(cf.amount) || cf.amount === 0) return `Kasbeweging ${index + 1}: 'amount' moet een getal ongelijk aan 0 zijn.`;
  if (typeof cf.description !== 'string') return `Kasbeweging ${index + 1}: 'description' is geen tekst.`;

  if (cf.recurring !== undefined) {
    if (!isObject(cf.recurring)) return `Kasbeweging ${index + 1}: 'recurring' is geen geldig object.`;
    const rec = cf.recurring as Record<string, unknown>;
    if (!isFiniteNumber(rec.intervalMonths) || rec.intervalMonths < 1 || !Number.isInteger(rec.intervalMonths)) {
      return `Kasbeweging ${index + 1}: 'recurring.intervalMonths' moet een geheel getal >= 1 zijn.`;
    }
  }

  return null;
}

function validateRateChange(value: unknown, index: number): string | null {
  if (!isObject(value)) return `Rentewijziging ${index + 1}: geen geldig object.`;
  const rc = value as Record<string, unknown>;

  if (!isNonEmptyString(rc.id)) return `Rentewijziging ${index + 1}: 'id' ontbreekt.`;
  if (typeof rc.date !== 'string' || !ISO_DATE_REGEX.test(rc.date)) return `Rentewijziging ${index + 1}: 'date' is geen geldige datum (YYYY-MM-DD).`;
  if (!isFiniteNumber(rc.annualInterestRate) || rc.annualInterestRate < 0) return `Rentewijziging ${index + 1}: 'annualInterestRate' moet >= 0 zijn.`;

  return null;
}

function validateExportedResult(value: unknown, index: number): string | null {
  if (!isObject(value)) return `Rekening ${index + 1}: geen geldig object.`;
  const r = value as Record<string, unknown>;

  if (!isNonEmptyString(r.id)) return `Rekening ${index + 1}: 'id' ontbreekt.`;
  if (!isFiniteNumber(r.timestamp) || r.timestamp <= 0) return `Rekening ${index + 1}: 'timestamp' is ongeldig.`;
  if (!isFiniteNumber(r.startAmount) || r.startAmount < 0) return `Rekening ${index + 1}: 'startAmount' moet >= 0 zijn.`;
  if (!isFiniteNumber(r.annualInterestRate) || r.annualInterestRate < 0) return `Rekening ${index + 1}: 'annualInterestRate' moet >= 0 zijn.`;
  if (!isFiniteNumber(r.durationMonths) || r.durationMonths < 0 || !Number.isInteger(r.durationMonths)) {
    return `Rekening ${index + 1}: 'durationMonths' moet een geheel getal >= 0 zijn.`;
  }
  if (!PAYOUT_INTERVAL_VALUES.includes(r.interval as string)) {
    return `Rekening ${index + 1}: 'interval' heeft een ongeldige waarde '${r.interval}'.`;
  }
  if (!INTEREST_TYPE_VALUES.includes(r.interestType as string)) {
    return `Rekening ${index + 1}: 'interestType' heeft een ongeldige waarde '${r.interestType}'.`;
  }
  if (r.startDate !== undefined && (typeof r.startDate !== 'string' || !ISO_DATE_REGEX.test(r.startDate))) {
    return `Rekening ${index + 1}: 'startDate' is geen geldige datum (YYYY-MM-DD).`;
  }

  if (!Array.isArray(r.periods)) {
    return `Rekening ${index + 1}: 'periods' moet een array zijn.`;
  }
  for (let i = 0; i < r.periods.length; i++) {
    const err = validatePeriodResult(r.periods[i], i);
    if (err) return `Rekening ${index + 1} > ${err}`;
  }

  if (r.cashFlows !== undefined) {
    if (!Array.isArray(r.cashFlows)) return `Rekening ${index + 1}: 'cashFlows' moet een array zijn.`;
    for (let i = 0; i < r.cashFlows.length; i++) {
      const err = validateCashFlow(r.cashFlows[i], i);
      if (err) return `Rekening ${index + 1} > ${err}`;
    }
  }

  if (r.isOngoing !== undefined && typeof r.isOngoing !== 'boolean') {
    return `Rekening ${index + 1}: 'isOngoing' moet een boolean zijn.`;
  }

  if (r.currency !== undefined) {
    if (typeof r.currency !== 'string' || !CURRENCY_VALUES.includes(r.currency)) {
      return `Rekening ${index + 1}: 'currency' heeft een ongeldige waarde '${r.currency}'.`;
    }
  }

  if (r.rateChanges !== undefined) {
    if (!Array.isArray(r.rateChanges)) return `Rekening ${index + 1}: 'rateChanges' moet een array zijn.`;
    for (let i = 0; i < r.rateChanges.length; i++) {
      const err = validateRateChange(r.rateChanges[i], i);
      if (err) return `Rekening ${index + 1} > ${err}`;
    }
  }

  return null;
}

export function validateExportFile(raw: unknown): ValidationResult {
  if (!isObject(raw)) {
    return { ok: false, error: 'Ongeldig bestand: geen geldig JSON-object.' };
  }

  const obj = raw as Record<string, unknown>;

  if (obj.version !== EXPORT_FORMAT_VERSION) {
    return { ok: false, error: `Ongeldig bestand: versie ${obj.version ?? 'onbekend'} wordt niet ondersteund (verwacht: ${EXPORT_FORMAT_VERSION}).` };
  }

  if (typeof obj.exportedAt !== 'string') {
    return { ok: false, error: 'Ongeldig bestand: \'exportedAt\' ontbreekt.' };
  }

  if (!Array.isArray(obj.results)) {
    return { ok: false, error: 'Ongeldig bestand: \'results\' moet een array zijn.' };
  }

  if (!Array.isArray(obj.portfolioIds) || !obj.portfolioIds.every((id: unknown) => typeof id === 'string')) {
    return { ok: false, error: 'Ongeldig bestand: \'portfolioIds\' moet een array van strings zijn.' };
  }

  for (let i = 0; i < obj.results.length; i++) {
    const err = validateExportedResult(obj.results[i], i);
    if (err) return { ok: false, error: err };
  }

  return {
    ok: true,
    data: {
      version: obj.version as number,
      exportedAt: obj.exportedAt as string,
      results: obj.results as ExportedResult[],
      portfolioIds: obj.portfolioIds as string[],
    },
  };
}
