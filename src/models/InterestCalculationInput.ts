import { PayoutInterval } from '../enums/PayoutInterval';
import { RenteType } from '../enums/RenteType';

export class InterestCalculationInput {
  constructor(
    public readonly startBedrag: number,
    public readonly jaarRentePercentage: number,
    public readonly looptijdMaanden: number,
    public readonly interval: PayoutInterval,
    public readonly renteType: RenteType,
    public readonly startDatum?: string,
  ) {}

  get looptijdJaren(): number {
    return this.looptijdMaanden / 12;
  }

  get label(): string {
    return `€${this.startBedrag.toLocaleString('nl-NL')} @ ${this.jaarRentePercentage}%`;
  }
}
