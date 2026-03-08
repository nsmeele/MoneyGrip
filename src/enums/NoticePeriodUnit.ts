import i18n from '../i18n';

export enum NoticePeriodUnit {
  Days = 'days',
  Months = 'months',
}

const NOTICE_PERIOD_UNIT_KEYS: Record<NoticePeriodUnit, string> = {
  [NoticePeriodUnit.Days]: 'noticePeriodUnit.days',
  [NoticePeriodUnit.Months]: 'noticePeriodUnit.months',
};

export function getNoticePeriodUnitLabel(unit: NoticePeriodUnit): string {
  return i18n.t(NOTICE_PERIOD_UNIT_KEYS[unit]);
}
