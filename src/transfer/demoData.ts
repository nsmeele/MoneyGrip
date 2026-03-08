import type { ExportFile } from '../models/ExportFile';
import { EXPORT_FORMAT_VERSION } from '../models/ExportFile';
import { PayoutInterval } from '../enums/PayoutInterval';
import { InterestType } from '../enums/InterestType';
import { DayCountConvention } from '../enums/DayCountConvention';
import { AccountType } from '../enums/AccountType';

export const demoData: ExportFile = {
  version: EXPORT_FORMAT_VERSION,
  exportedAt: new Date().toISOString(),
  portfolioIds: [
    'demo-0001-0001-0001-000000000001',
    'demo-0001-0001-0001-000000000002',
    'demo-0001-0001-0001-000000000003',
    'demo-0001-0001-0001-000000000004',
    'demo-0001-0001-0001-000000000005',
    'demo-0001-0001-0001-000000000006',
    'demo-0001-0001-0001-000000000007',
    'demo-0001-0001-0001-000000000008',
    'demo-0001-0001-0001-000000000009',
  ],
  results: [
    {
      id: 'demo-0001-0001-0001-000000000001',
      timestamp: 1741305600000,
      startAmount: 5000,
      annualInterestRate: 1.4,
      durationMonths: 0,
      interval: PayoutInterval.Monthly,
      interestType: InterestType.Compound,
      startDate: '2025-09-01',

      cashFlows: [
        { id: 'cf-1a', date: '2025-11-01', amount: 500, description: 'Storting' },
        { id: 'cf-1b', date: '2026-01-15', amount: -1000, description: 'Opname' },
      ],
      rateChanges: [
        { id: 'rc-1a', date: '2025-12-01', annualInterestRate: 1.2 },
        { id: 'rc-1b', date: '2026-03-01', annualInterestRate: 1.05 },
      ],
      isOngoing: true,
      isVariableRate: true,
      dayCount: DayCountConvention.NOM_12,
      accountType: AccountType.Savings,
    },
    {
      id: 'demo-0001-0001-0001-000000000002',
      timestamp: 1741305700000,
      startAmount: 8000,
      annualInterestRate: 1.75,
      durationMonths: 0,
      interval: PayoutInterval.Monthly,
      interestType: InterestType.Compound,
      startDate: '2025-05-01',

      cashFlows: [
        { id: 'cf-2a', date: '2025-07-01', amount: 200, description: 'Maandelijkse inleg', recurring: { intervalMonths: 1 } },
        { id: 'cf-2b', date: '2025-10-01', amount: 500, description: 'Kwartaalstorting', recurring: { intervalMonths: 3 } },
        { id: 'cf-2c', date: '2025-12-01', amount: -2000, description: 'Opname' },
      ],
      isOngoing: true,
      dayCount: DayCountConvention.NOM_12,
      accountType: AccountType.Savings,
    },
    {
      id: 'demo-0001-0001-0001-000000000003',
      timestamp: 1741305800000,
      startAmount: 3000,
      annualInterestRate: 1.25,
      durationMonths: 0,
      interval: PayoutInterval.Quarterly,
      interestType: InterestType.Compound,
      startDate: '2025-03-15',

      cashFlows: [
        { id: 'cf-3a', date: '2025-06-01', amount: 1000, description: 'Storting' },
        { id: 'cf-3b', date: '2025-10-01', amount: -500, description: 'Opname' },
      ],
      rateChanges: [
        { id: 'rc-3a', date: '2025-09-01', annualInterestRate: 1.1 },
      ],
      isOngoing: true,
      isVariableRate: true,
      dayCount: DayCountConvention.NOM_12,
      accountType: AccountType.Savings,
    },
    {
      id: 'demo-0001-0001-0001-000000000004',
      timestamp: 1741305900000,
      startAmount: 8000,
      annualInterestRate: 2.4,
      durationMonths: 12,
      interval: PayoutInterval.AtMaturity,
      interestType: InterestType.Simple,
      startDate: '2025-07-01',

      dayCount: DayCountConvention.NOM_12,
      accountType: AccountType.Deposit,
    },
    {
      id: 'demo-0001-0001-0001-000000000005',
      timestamp: 1741306000000,
      startAmount: 12000,
      annualInterestRate: 1.95,
      durationMonths: 12,
      interval: PayoutInterval.AtMaturity,
      interestType: InterestType.Simple,
      startDate: '2025-12-01',

      dayCount: DayCountConvention.NOM_12,
      accountType: AccountType.Deposit,
    },
    {
      id: 'demo-0001-0001-0001-000000000006',
      timestamp: 1741306100000,
      startAmount: 10000,
      annualInterestRate: 2.5,
      durationMonths: 18,
      interval: PayoutInterval.AtMaturity,
      interestType: InterestType.Simple,
      startDate: '2025-08-01',

      dayCount: DayCountConvention.NOM_12,
      accountType: AccountType.Deposit,
    },
    {
      id: 'demo-0001-0001-0001-000000000007',
      timestamp: 1741306200000,
      startAmount: 15000,
      annualInterestRate: 2.56,
      durationMonths: 24,
      interval: PayoutInterval.SemiAnnually,
      interestType: InterestType.Compound,
      startDate: '2025-04-01',

      dayCount: DayCountConvention.NOM_12,
      accountType: AccountType.Investment,
    },
    {
      id: 'demo-0001-0001-0001-000000000008',
      timestamp: 1741306300000,
      startAmount: 14000,
      annualInterestRate: 2.75,
      durationMonths: 36,
      interval: PayoutInterval.Annually,
      interestType: InterestType.Compound,
      startDate: '2025-03-07',

      dayCount: DayCountConvention.NOM_12,
      accountType: AccountType.Investment,
    },
    {
      id: 'demo-0001-0001-0001-000000000009',
      timestamp: 1741306400000,
      startAmount: 25000,
      annualInterestRate: 2.95,
      durationMonths: 60,
      interval: PayoutInterval.Annually,
      interestType: InterestType.Compound,
      startDate: '2025-06-01',

      dayCount: DayCountConvention.NOM_12,
      accountType: AccountType.Deposit,
    },
  ],
};
