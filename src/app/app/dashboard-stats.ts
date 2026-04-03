type Entry = {
  id: string;
  projectId: string;
  date: string;
  hours: number;
  billable: boolean;
  invoiceId: string | null;
};

type Invoice = {
  id: string;
  status: string;
  total: number;
};

export type DashboardStats = {
  todayHours: number;
  weekHours: number;
  unbilledAmount: number;
  outstandingAmount: number;
};

/**
 * Compute dashboard stats from pre-fetched entries and invoices.
 * @param todayEntries - entries for today
 * @param weekEntries - entries for the current week
 * @param invoices - all user invoices
 * @param rateMap - projectId → hourly rate lookup
 */
export function computeDashboardStats(
  todayEntries: Entry[],
  weekEntries: Entry[],
  invoices: Invoice[],
  rateMap: Record<string, number>
): DashboardStats {
  const todayHours = todayEntries.reduce((sum, e) => sum + e.hours, 0);
  const weekHours = weekEntries.reduce((sum, e) => sum + e.hours, 0);

  // Unbilled = billable entries not yet on an invoice
  const unbilledAmount = weekEntries
    .filter((e) => e.billable && !e.invoiceId)
    .reduce((sum, e) => sum + e.hours * (rateMap[e.projectId] ?? 0), 0);

  // Outstanding = sent or overdue invoices
  const outstandingAmount = invoices
    .filter((inv) => inv.status === "sent" || inv.status === "overdue")
    .reduce((sum, inv) => sum + inv.total, 0);

  return { todayHours, weekHours, unbilledAmount, outstandingAmount };
}
