import { PayoutInterval } from '../enums/PayoutInterval';
import { RenteType } from '../enums/RenteType';

export interface PeriodResult {
  periode: number;
  periodeLabel: string;
  beginSaldo: number;
  renteOpbrengst: number;
  uitbetaald: number;
  eindSaldo: number;
}

export class InterestCalculationResult {
  public readonly id: string;
  public readonly timestamp: number;

  constructor(
    public readonly startBedrag: number,
    public readonly jaarRentePercentage: number,
    public readonly looptijdMaanden: number,
    public readonly interval: PayoutInterval,
    public readonly renteType: RenteType,
    public readonly startDatum: string | undefined,
    public readonly perioden: PeriodResult[],
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = Date.now();
  }

  get totaleRente(): number {
    return this.perioden.reduce((sum, p) => sum + p.renteOpbrengst, 0);
  }

  get eindBedrag(): number {
    if (this.perioden.length === 0) return this.startBedrag;
    return this.perioden[this.perioden.length - 1].eindSaldo;
  }

  get totaalUitbetaald(): number {
    return this.perioden.reduce((sum, p) => sum + p.uitbetaald, 0);
  }

  get eindDatum(): string | undefined {
    if (!this.startDatum) return undefined;
    const d = new Date(this.startDatum + 'T00:00:00');
    d.setMonth(d.getMonth() + this.looptijdMaanden);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  get isNogNietGestart(): boolean {
    if (!this.startDatum) return false;
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return this.startDatum > `${y}-${m}-${d}`;
  }

  get isVerlopen(): boolean {
    if (!this.eindDatum) return false;
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return this.eindDatum < `${y}-${m}-${d}`;
  }

  get label(): string {
    return `€${this.startBedrag.toLocaleString('nl-NL')} @ ${this.jaarRentePercentage}%`;
  }
}
