/**
 * Format a number as Australian dollar currency.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format an ISO date string (YYYY-MM-DD) as dd/mm/yyyy.
 */
export function formatInvoiceDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}
