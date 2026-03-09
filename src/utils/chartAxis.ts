import { CURRENCY_CONFIG, type Currency } from '../enums/Currency';

const ESTIMATED_CHAR_WIDTH = 7;
const MIN_LABEL_GAP = 8;
const DEFAULT_LABEL_LENGTH = 7;
const SAFE_MOBILE_MAX_LABELS = 4;

/**
 * Calculates the optimal tick interval based on container width and data length.
 * Estimates how many horizontal labels fit without overlapping.
 */
export function getTickInterval(dataLength: number, containerWidth: number, labelLength = DEFAULT_LABEL_LENGTH): number {
  if (dataLength <= 1) return 0;

  // Before ResizeObserver fires, use a conservative fallback
  if (containerWidth <= 0) {
    return Math.max(0, Math.ceil(dataLength / SAFE_MOBILE_MAX_LABELS) - 1);
  }

  const slotWidth = labelLength * ESTIMATED_CHAR_WIDTH + MIN_LABEL_GAP;
  const maxLabels = Math.max(2, Math.floor(containerWidth / slotWidth));

  if (dataLength <= maxLabels) return 0;
  return Math.ceil(dataLength / maxLabels) - 1;
}

/**
 * Formats a currency value in compact notation for chart Y-axis labels.
 * Examples (EUR): € 1.250 → €1,3k, € 125.000 → €125k, € 1.500.000 → €1,5M
 */
export function formatCompactCurrency(value: number, currencyCode: string): string {
  const config = CURRENCY_CONFIG[currencyCode as Currency];
  if (!config) return String(value);

  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const decimal = config.decimal;
  const isSuffix = config.pattern.startsWith('#');

  let compact: string;
  if (abs >= 1_000_000) {
    const m = abs / 1_000_000;
    compact = m % 1 === 0 ? `${m}M` : `${formatDecimal(m, 1, decimal)}M`;
  } else if (abs >= 1_000) {
    const k = abs / 1_000;
    compact = k % 1 === 0 ? `${k}k` : `${formatDecimal(k, 1, decimal)}k`;
  } else {
    compact = String(Math.round(abs));
  }

  return isSuffix
    ? `${sign}${compact}${config.symbol}`
    : `${sign}${config.symbol}${compact}`;
}

function formatDecimal(value: number, precision: number, decimalChar: string): string {
  const fixed = value.toFixed(precision);
  return decimalChar === '.' ? fixed : fixed.replace('.', decimalChar);
}
