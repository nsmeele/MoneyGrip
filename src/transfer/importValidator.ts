import { PayoutInterval } from '../enums/PayoutInterval';
import { InterestType } from '../enums/InterestType';
import { Currency } from '../enums/Currency';
import { DayCountConvention } from '../enums/DayCountConvention';
import { AccountType } from '../enums/AccountType';
import { NoticePeriodUnit } from '../enums/NoticePeriodUnit';
import { EXPORT_FORMAT_VERSION } from '../models/ExportFile';
import type { ExportFile, ExportedResult } from '../models/ExportFile';

export type ValidationResult =
  | { ok: true; data: ExportFile }
  | { ok: false; error: string };

const PAYOUT_INTERVAL_VALUES = Object.values(PayoutInterval) as string[];
const INTEREST_TYPE_VALUES = Object.values(InterestType) as string[];
const CURRENCY_VALUES = Object.values(Currency) as string[];
const DAY_COUNT_VALUES = Object.values(DayCountConvention) as string[];
const ACCOUNT_TYPE_VALUES = Object.values(AccountType) as string[];
const NOTICE_PERIOD_UNIT_VALUES = Object.values(NoticePeriodUnit) as string[];
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

function validateCashFlow(value: unknown, index: number): string | null {
  if (!isObject(value)) return `Kasbeweging ${index + 1}: geen geldig object.`;
  const cf = value as Record<string, unknown>;

  if (!isNonEmptyString(cf.id)) return `Kasbeweging ${index + 1}: 'id' ontbreekt.`;
  if (typeof cf.date !== 'string' || !ISO_DATE_REGEX.test(cf.date)) return `Kasbeweging ${index + 1}: 'date' is geen geldige datum (YYYY-MM-DD).`;
  if (!isFiniteNumber(cf.amount) || cf.amount === 0) return `Kasbeweging ${index + 1}: 'amount' moet een getal ongelijk aan 0 zijn.`;
  if (typeof cf.description !== 'string') return `Kasbeweging ${index + 1}: 'description' is geen tekst.`;

  if (cf.transferId !== undefined && !isNonEmptyString(cf.transferId)) {
    return `Kasbeweging ${index + 1}: 'transferId' moet een tekst zijn.`;
  }

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

  if (r.dayCount !== undefined && (typeof r.dayCount !== 'string' || !DAY_COUNT_VALUES.includes(r.dayCount))) {
    return `Rekening ${index + 1}: 'dayCount' heeft een ongeldige waarde '${r.dayCount}'.`;
  }

  if (r.currency !== undefined) {
    if (typeof r.currency !== 'string' || !CURRENCY_VALUES.includes(r.currency)) {
      return `Rekening ${index + 1}: 'currency' heeft een ongeldige waarde '${r.currency}'.`;
    }
  }

  if (r.isVariableRate !== undefined && typeof r.isVariableRate !== 'boolean') {
    return `Rekening ${index + 1}: 'isVariableRate' moet een boolean zijn.`;
  }

  if (r.hasCashFlows !== undefined && typeof r.hasCashFlows !== 'boolean') {
    return `Rekening ${index + 1}: 'hasCashFlows' moet een boolean zijn.`;
  }

  if (r.accountType !== undefined && (typeof r.accountType !== 'string' || !ACCOUNT_TYPE_VALUES.includes(r.accountType))) {
    return `Rekening ${index + 1}: 'accountType' heeft een ongeldige waarde '${r.accountType}'.`;
  }

  if (r.noticePeriodValue !== undefined && (!isFiniteNumber(r.noticePeriodValue) || r.noticePeriodValue < 0)) {
    return `Rekening ${index + 1}: 'noticePeriodValue' moet >= 0 zijn.`;
  }

  if (r.noticePeriodUnit !== undefined && (typeof r.noticePeriodUnit !== 'string' || !NOTICE_PERIOD_UNIT_VALUES.includes(r.noticePeriodUnit))) {
    return `Rekening ${index + 1}: 'noticePeriodUnit' heeft een ongeldige waarde '${r.noticePeriodUnit}'.`;
  }

  if (r.processingDays !== undefined && (!isFiniteNumber(r.processingDays) || r.processingDays < 0 || !Number.isInteger(r.processingDays))) {
    return `Rekening ${index + 1}: 'processingDays' moet een geheel getal >= 0 zijn.`;
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
