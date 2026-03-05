import type { IInterestCalculator } from '../interfaces/IInterestCalculator';
import type { InterestCalculationInput } from '../models/InterestCalculationInput';
import { InterestCalculationResult } from '../models/InterestCalculationResult';
import { InterestStrategyFactory } from '../factories/InterestStrategyFactory';

export class InterestCalculator implements IInterestCalculator {
  calculate(input: InterestCalculationInput): InterestCalculationResult {
    const strategy = InterestStrategyFactory.create(input.renteType);
    const perioden = strategy.calculate(input);

    return new InterestCalculationResult(
      input.startBedrag,
      input.jaarRentePercentage,
      input.looptijdMaanden,
      input.interval,
      input.renteType,
      input.startDatum,
      perioden,
    );
  }
}
