import type { BankAccount } from '../models/BankAccount';
import type { ExportFile, ExportedResult, StoredResult } from '../models/ExportFile';
import type { MoneyTransfer } from '../models/MoneyTransfer';
import { EXPORT_FORMAT_VERSION } from '../models/ExportFile';

export function toExportedResult(r: BankAccount): ExportedResult {
  return {
    id: r.id,
    timestamp: r.timestamp,
    startAmount: r.startAmount,
    annualInterestRate: r.annualInterestRate,
    durationMonths: r.durationMonths,
    interval: r.interval,
    interestType: r.interestType,
    startDate: r.startDate,
    cashFlows: r.cashFlows,
    isOngoing: r.isOngoing,
    dayCount: r.dayCount,
    rateChanges: r.rateChanges.length > 0 ? r.rateChanges : undefined,
    isVariableRate: r.isVariableRate || undefined,
    currency: r.currency || undefined,
    accountType: r.accountType || undefined,
    hasCashFlows: r.hasCashFlows === false ? false : undefined,
    noticePeriodValue: r.noticePeriodValue || undefined,
    noticePeriodUnit: r.noticePeriodUnit || undefined,
    processingDays: r.processingDays || undefined,
  };
}

export function toStoredResult(r: BankAccount): StoredResult {
  return {
    ...toExportedResult(r),
    periods: r.periods,
  };
}

export function serializeToExportFile(
  results: BankAccount[],
  portfolioIds: Set<string>,
  transfers: MoneyTransfer[] = [],
): ExportFile {
  return {
    version: EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    results: results.map(toExportedResult),
    portfolioIds: [...portfolioIds],
    transfers: transfers.length > 0 ? transfers : undefined,
  };
}
