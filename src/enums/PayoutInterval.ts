export enum PayoutInterval {
  Dagelijks = 'dagelijks',
  Maandelijks = 'maandelijks',
  PerKwartaal = 'per_kwartaal',
  PerHalfJaar = 'per_half_jaar',
  PerJaar = 'per_jaar',
  Deposito = 'deposito',
}

export const INTERVAL_LABELS: Record<PayoutInterval, string> = {
  [PayoutInterval.Dagelijks]: 'Dagelijks',
  [PayoutInterval.Maandelijks]: 'Maandelijks',
  [PayoutInterval.PerKwartaal]: 'Per kwartaal',
  [PayoutInterval.PerHalfJaar]: 'Per half jaar',
  [PayoutInterval.PerJaar]: 'Per jaar',
  [PayoutInterval.Deposito]: 'Deposito (einde looptijd)',
};

export function getPeriodsPerYear(interval: PayoutInterval): number {
  switch (interval) {
    case PayoutInterval.Dagelijks: return 365;
    case PayoutInterval.Maandelijks: return 12;
    case PayoutInterval.PerKwartaal: return 4;
    case PayoutInterval.PerHalfJaar: return 2;
    case PayoutInterval.PerJaar: return 1;
    case PayoutInterval.Deposito: return 1;
  }
}
