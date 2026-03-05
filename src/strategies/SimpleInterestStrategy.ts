import type { IInterestStrategy } from '../interfaces/IInterestStrategy';
import type { InterestCalculationInput } from '../models/InterestCalculationInput';
import type { PeriodResult } from '../models/InterestCalculationResult';
import { PayoutInterval, getPeriodsPerYear } from '../enums/PayoutInterval';

export class SimpleInterestStrategy implements IInterestStrategy {
  calculate(input: InterestCalculationInput): PeriodResult[] {
    if (input.interval === PayoutInterval.Deposito) {
      const looptijdJaren = input.looptijdMaanden / 12;
      const renteOpbrengst = input.startBedrag * (input.jaarRentePercentage / 100) * looptijdJaren;

      return [{
        periode: 1,
        periodeLabel: 'Einde looptijd',
        beginSaldo: input.startBedrag,
        renteOpbrengst,
        uitbetaald: renteOpbrengst,
        eindSaldo: input.startBedrag,
      }];
    }

    const periodenPerJaar = getPeriodsPerYear(input.interval);
    const renteFractie = input.jaarRentePercentage / 100 / periodenPerJaar;
    const totaalPerioden = Math.floor(input.looptijdMaanden / 12 * periodenPerJaar);
    const perioden: PeriodResult[] = [];

    for (let i = 1; i <= totaalPerioden; i++) {
      const renteOpbrengst = input.startBedrag * renteFractie;

      perioden.push({
        periode: i,
        periodeLabel: `Periode ${i}`,
        beginSaldo: input.startBedrag,
        renteOpbrengst,
        uitbetaald: renteOpbrengst,
        eindSaldo: input.startBedrag,
      });
    }

    return perioden;
  }
}
