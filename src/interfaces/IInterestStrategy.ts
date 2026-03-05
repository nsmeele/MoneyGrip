import type { InterestCalculationInput } from '../models/InterestCalculationInput';
import type { PeriodResult } from '../models/InterestCalculationResult';

export interface IInterestStrategy {
  calculate(input: InterestCalculationInput): PeriodResult[];
}
