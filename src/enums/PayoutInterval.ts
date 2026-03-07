import i18n from '../i18n';

export enum PayoutInterval {
  Daily = 'daily',
  Monthly = 'monthly',
  Quarterly = 'quarterly',
  SemiAnnually = 'semi_annually',
  Annually = 'annually',
  AtMaturity = 'at_maturity',
}

const INTERVAL_KEYS: Record<PayoutInterval, string> = {
  [PayoutInterval.Daily]: 'interval.daily',
  [PayoutInterval.Monthly]: 'interval.monthly',
  [PayoutInterval.Quarterly]: 'interval.quarterly',
  [PayoutInterval.SemiAnnually]: 'interval.semiAnnually',
  [PayoutInterval.Annually]: 'interval.annually',
  [PayoutInterval.AtMaturity]: 'interval.atMaturity',
};

export function getIntervalLabel(interval: PayoutInterval): string {
  return i18n.t(INTERVAL_KEYS[interval]);
}

/** @deprecated Use getIntervalLabel() for i18n support */
export const INTERVAL_LABELS: Record<PayoutInterval, string> = new Proxy(
  {} as Record<PayoutInterval, string>,
  { get: (_, key: string) => getIntervalLabel(key as PayoutInterval) },
);

export function getPeriodsPerYear(interval: PayoutInterval): number {
  switch (interval) {
    case PayoutInterval.Daily: return 365;
    case PayoutInterval.Monthly: return 12;
    case PayoutInterval.Quarterly: return 4;
    case PayoutInterval.SemiAnnually: return 2;
    case PayoutInterval.Annually: return 1;
    case PayoutInterval.AtMaturity: return 1;
  }
}
