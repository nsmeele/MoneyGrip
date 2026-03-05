import type { InterestCalculationInput } from '../models/InterestCalculationInput';
import type { InterestCalculationResult } from '../models/InterestCalculationResult';

export interface IInterestCalculator {
  calculate(input: InterestCalculationInput): InterestCalculationResult;
}
