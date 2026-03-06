import type { BankAccount } from '../models/BankAccount';
import type { ExportFile, ExportedResult } from '../models/ExportFile';
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
    periods: r.periods,
    cashFlows: r.cashFlows,
    isOngoing: r.isOngoing,
  };
}

export function serializeToExportFile(
  results: BankAccount[],
  portfolioIds: Set<string>,
): ExportFile {
  return {
    version: EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    results: results.map(toExportedResult),
    portfolioIds: [...portfolioIds],
  };
}
