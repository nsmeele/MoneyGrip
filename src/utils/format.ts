export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

export function formatLooptijd(maanden: number): string {
  const j = Math.floor(maanden / 12);
  const m = maanden % 12;
  if (m === 0) return `${j} jaar`;
  if (j === 0) return `${m} maanden`;
  return `${j} jaar, ${m} mnd`;
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString + 'T00:00:00');
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatLooptijdKort(maanden: number): string {
  const j = Math.floor(maanden / 12);
  const m = maanden % 12;
  if (m === 0) return `${j} jr`;
  if (j === 0) return `${m} mnd`;
  return `${j} jr ${m} mnd`;
}
