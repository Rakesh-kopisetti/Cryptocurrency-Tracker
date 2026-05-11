export const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2
});

export const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2
});

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) {
    return '$0.00';
  }

  return currencyFormatter.format(value);
}

export function formatCompactCurrency(value: number): string {
  if (!Number.isFinite(value)) {
    return '$0.00';
  }

  return compactCurrencyFormatter.format(value);
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return '0.00%';
  }

  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}