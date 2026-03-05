// Mexican peso format: $1,232.00 (comma for thousands, period for decimals)
export function formatMXN(amount: number): string {
  return '$' + amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Short format without decimals for menu prices: $127
export function formatPrice(amount: number): string {
  if (Number.isInteger(amount)) {
    return '$' + amount.toLocaleString('en-US');
  }
  return formatMXN(amount);
}
