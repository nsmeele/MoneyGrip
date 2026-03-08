import { parseDate, toISO, addMonthsToDate } from './date';
import { addDays } from 'date-fns';
import { NoticePeriodUnit } from '../enums/NoticePeriodUnit';

function addBusinessDays(date: Date, days: number): Date {
  let current = date;
  let remaining = days;
  while (remaining > 0) {
    current = addDays(current, 1);
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) {
      remaining--;
    }
  }
  return current;
}

export function addNoticePeriod(
  date: Date,
  value: number | undefined,
  unit: NoticePeriodUnit | undefined,
): Date {
  if (!value || value <= 0) return date;
  if (unit === NoticePeriodUnit.Months) {
    return addMonthsToDate(date, value);
  }
  // Default to calendar days (notice periods are typically calendar-based)
  return addDays(date, value);
}

export interface TransferDateParams {
  initiationDate: string;
  sourceNoticePeriodValue?: number;
  sourceNoticePeriodUnit?: NoticePeriodUnit;
  sourceProcessingDays?: number;
  targetProcessingDays?: number;
}

export interface TransferDates {
  withdrawalDate: string;
  depositDate: string;
}

export function calculateTransferDates(params: TransferDateParams): TransferDates {
  const initiation = parseDate(params.initiationDate);

  // Withdrawal = initiation + notice period
  const afterNotice = addNoticePeriod(
    initiation,
    params.sourceNoticePeriodValue,
    params.sourceNoticePeriodUnit,
  );

  // Then add source processing days (business days)
  const withdrawal = addBusinessDays(afterNotice, params.sourceProcessingDays ?? 0);

  // Deposit = withdrawal + target processing days (business days)
  const deposit = addBusinessDays(withdrawal, params.targetProcessingDays ?? 0);

  return {
    withdrawalDate: toISO(withdrawal),
    depositDate: toISO(deposit),
  };
}
