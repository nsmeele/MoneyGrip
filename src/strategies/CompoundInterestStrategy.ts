import type { IInterestStrategy } from '../interfaces/IInterestStrategy';
import type { InterestCalculationInput } from '../models/InterestCalculationInput';
import type { PeriodResult } from '../models/InterestCalculationResult';
import { PayoutInterval, getPeriodsPerYear } from '../enums/PayoutInterval';

export class CompoundInterestStrategy implements IInterestStrategy {
  calculate(input: InterestCalculationInput): PeriodResult[] {
    if (input.interval === PayoutInterval.Deposito) {
      const looptijdJaren = input.looptijdMaanden / 12;
      const renteOpbrengst = input.startBedrag * (Math.pow(1 + input.jaarRentePercentage / 100, looptijdJaren) - 1);

      return [{
        periode: 1,
        periodeLabel: 'Einde looptijd',
        beginSaldo: input.startBedrag,
        renteOpbrengst,
        uitbetaald: renteOpbrengst,
        eindSaldo: input.startBedrag + renteOpbrengst,
      }];
    }

    const periodenPerJaar = getPeriodsPerYear(input.interval);
    const renteFractie = input.jaarRentePercentage / 100 / periodenPerJaar;
    const totaalPerioden = Math.floor(input.looptijdMaanden / 12 * periodenPerJaar);
    const perioden: PeriodResult[] = [];

    let huidigSaldo = input.startBedrag;

    for (let i = 1; i <= totaalPerioden; i++) {
      const renteOpbrengst = huidigSaldo * renteFractie;
      const nieuwSaldo = huidigSaldo + renteOpbrengst;

      perioden.push({
        periode: i,
        periodeLabel: `Periode ${i}`,
        beginSaldo: huidigSaldo,
        renteOpbrengst,
        uitbetaald: renteOpbrengst,
        eindSaldo: nieuwSaldo,
      });

      huidigSaldo = nieuwSaldo;
    }

    return perioden;
  }
}
