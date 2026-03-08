import type { CashFlow } from '../../models/CashFlow';

const INITIAL_FORM = {
  isWithdrawal: false, date: '', amount: '', description: '',
  isRecurring: false, intervalMonths: 1, endDate: '',
  amountError: '',
};

export type CashFlowFormState = typeof INITIAL_FORM;

export { INITIAL_FORM };

export function cashFlowToFormState(cf: CashFlow): CashFlowFormState {
  return {
    isWithdrawal: cf.amount < 0,
    date: cf.date,
    amount: String(Math.abs(cf.amount)).replace('.', ','),
    description: cf.description,
    isRecurring: !!cf.recurring,
    intervalMonths: cf.recurring?.intervalMonths ?? 1,
    endDate: cf.recurring?.endDate ?? '',
    amountError: '',
  };
}
