import i18n from '../i18n';

export enum DayCountConvention {
  NOM_12 = 'nom_12',
  ACT_365 = 'act_365',
  ACT_ACT = 'act_act',
  THIRTY_360 = '30_360',
}

const DAY_COUNT_LABEL_KEYS: Record<DayCountConvention, string> = {
  [DayCountConvention.NOM_12]: 'dayCount.nom12',
  [DayCountConvention.ACT_365]: 'dayCount.act365',
  [DayCountConvention.ACT_ACT]: 'dayCount.actAct',
  [DayCountConvention.THIRTY_360]: 'dayCount.thirty360',
};

const DAY_COUNT_DESC_KEYS: Record<DayCountConvention, string> = {
  [DayCountConvention.NOM_12]: 'dayCount.nom12Desc',
  [DayCountConvention.ACT_365]: 'dayCount.act365Desc',
  [DayCountConvention.ACT_ACT]: 'dayCount.actActDesc',
  [DayCountConvention.THIRTY_360]: 'dayCount.thirty360Desc',
};

export function getDayCountLabel(convention: DayCountConvention): string {
  return i18n.t(DAY_COUNT_LABEL_KEYS[convention]);
}

export function getDayCountDescription(convention: DayCountConvention): string {
  return i18n.t(DAY_COUNT_DESC_KEYS[convention]);
}

/** @deprecated Use getDayCountLabel() for i18n support */
export const DAY_COUNT_LABELS: Record<DayCountConvention, string> = new Proxy(
  {} as Record<DayCountConvention, string>,
  { get: (_, key: string) => getDayCountLabel(key as DayCountConvention) },
);

/** @deprecated Use getDayCountDescription() for i18n support */
export const DAY_COUNT_DESCRIPTIONS: Record<DayCountConvention, string> = new Proxy(
  {} as Record<DayCountConvention, string>,
  { get: (_, key: string) => getDayCountDescription(key as DayCountConvention) },
);
