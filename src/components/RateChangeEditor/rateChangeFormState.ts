import type { RateChange } from '../../models/RateChange';

const INITIAL_FORM = { date: '', rate: '', errors: {} as Record<string, string> };

export type RateChangeFormState = typeof INITIAL_FORM;

export { INITIAL_FORM };

export function rateChangeToFormState(rc: RateChange): RateChangeFormState {
  return {
    date: rc.date,
    rate: String(rc.annualInterestRate).replace('.', ','),
    errors: {},
  };
}
