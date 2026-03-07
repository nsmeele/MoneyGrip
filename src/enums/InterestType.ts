import i18n from '../i18n';

export enum InterestType {
  Simple = 'simple',
  Compound = 'compound',
}

const INTEREST_TYPE_KEYS: Record<InterestType, string> = {
  [InterestType.Simple]: 'interestType.simple',
  [InterestType.Compound]: 'interestType.compound',
};

export function getInterestTypeLabel(type: InterestType): string {
  return i18n.t(INTEREST_TYPE_KEYS[type]);
}

/** @deprecated Use getInterestTypeLabel() for i18n support */
export const INTEREST_TYPE_LABELS: Record<InterestType, string> = new Proxy(
  {} as Record<InterestType, string>,
  { get: (_, key: string) => getInterestTypeLabel(key as InterestType) },
);
