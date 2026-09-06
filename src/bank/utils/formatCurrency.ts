export function formatCurrency(value: number) {
  return "$" + (value / 100).toFixed(2);
}

export function formatSignedCurrency(value: number) {
  return (value < 0 ? "–" : "+") + formatCurrency(Math.abs(value));
}
