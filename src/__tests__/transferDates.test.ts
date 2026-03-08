import { describe, it, expect } from 'vitest';
import { calculateTransferDates } from '../utils/transferDates';
import { NoticePeriodUnit } from '../enums/NoticePeriodUnit';

describe('calculateTransferDates', () => {
  it('returns same date when no notice period or processing days', () => {
    const result = calculateTransferDates({
      initiationDate: '2026-03-01',
    });
    expect(result.withdrawalDate).toBe('2026-03-01');
    expect(result.depositDate).toBe('2026-03-01');
  });

  it('adds notice period in days', () => {
    const result = calculateTransferDates({
      initiationDate: '2026-03-01',
      sourceNoticePeriodValue: 33,
      sourceNoticePeriodUnit: NoticePeriodUnit.Days,
    });
    // 2026-03-01 + 33 calendar days = 2026-04-03
    expect(result.withdrawalDate).toBe('2026-04-03');
    expect(result.depositDate).toBe('2026-04-03');
  });

  it('adds notice period in months', () => {
    const result = calculateTransferDates({
      initiationDate: '2026-03-01',
      sourceNoticePeriodValue: 3,
      sourceNoticePeriodUnit: NoticePeriodUnit.Months,
    });
    expect(result.withdrawalDate).toBe('2026-06-01');
    expect(result.depositDate).toBe('2026-06-01');
  });

  it('adds source processing days as business days', () => {
    // 2026-03-02 is a Monday
    const result = calculateTransferDates({
      initiationDate: '2026-03-02',
      sourceProcessingDays: 3,
    });
    // Mon + 3 business days = Thu 2026-03-05
    expect(result.withdrawalDate).toBe('2026-03-05');
    expect(result.depositDate).toBe('2026-03-05');
  });

  it('skips weekends for processing days', () => {
    // 2026-03-06 is a Friday
    const result = calculateTransferDates({
      initiationDate: '2026-03-06',
      sourceProcessingDays: 2,
    });
    // Fri + 1 business day = Mon, + 1 = Tue 2026-03-10
    expect(result.withdrawalDate).toBe('2026-03-10');
    expect(result.depositDate).toBe('2026-03-10');
  });

  it('adds target processing days after withdrawal', () => {
    // 2026-03-02 is a Monday
    const result = calculateTransferDates({
      initiationDate: '2026-03-02',
      sourceProcessingDays: 1,
      targetProcessingDays: 2,
    });
    // Mon + 1 = Tue (withdrawal)
    expect(result.withdrawalDate).toBe('2026-03-03');
    // Tue + 2 = Thu (deposit)
    expect(result.depositDate).toBe('2026-03-05');
  });

  it('combines notice period, source and target processing days', () => {
    // 2026-01-01 is a Thursday
    const result = calculateTransferDates({
      initiationDate: '2026-01-01',
      sourceNoticePeriodValue: 33,
      sourceNoticePeriodUnit: NoticePeriodUnit.Days,
      sourceProcessingDays: 2,
      targetProcessingDays: 1,
    });
    // 2026-01-01 + 33 days = 2026-02-03 (Tuesday)
    // + 2 business days = Thu 2026-02-05 (withdrawal)
    expect(result.withdrawalDate).toBe('2026-02-05');
    // + 1 business day = Fri 2026-02-06 (deposit)
    expect(result.depositDate).toBe('2026-02-06');
  });

  it('handles zero notice period', () => {
    const result = calculateTransferDates({
      initiationDate: '2026-03-02',
      sourceNoticePeriodValue: 0,
      sourceNoticePeriodUnit: NoticePeriodUnit.Days,
      sourceProcessingDays: 1,
    });
    expect(result.withdrawalDate).toBe('2026-03-03');
  });
});
