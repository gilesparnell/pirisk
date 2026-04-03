type WeekEntry = {
  date: string;
  hours: number;
  billable: boolean;
};

type RevenueEntry = {
  projectId: string;
  hours: number;
  billable: boolean;
  invoiceId: string | null;
};

type AgingInvoice = {
  id: string;
  status: string;
  total: number;
  dueDate: string;
};

export type DayData = { day: string; hours: number };
export type ClientRevenue = { clientId: string; amount: number };
export type AgeBucket = { bucket: string; amount: number };

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Build weekly hours bar chart data from entries.
 * @param entries - entries for the week
 * @param monday - ISO date string for Monday of the week
 */
export function computeWeeklyHoursData(
  entries: WeekEntry[],
  monday: string
): DayData[] {
  // Build date→dayIndex map using string arithmetic to avoid timezone issues
  const dateToDay = new Map<string, number>();
  const [y, m, d] = monday.split("-").map(Number);
  for (let i = 0; i < 7; i++) {
    const date = new Date(Date.UTC(y, m - 1, d + i));
    const iso = date.toISOString().split("T")[0];
    dateToDay.set(iso, i);
  }

  const hours = new Array(7).fill(0);
  for (const entry of entries) {
    const idx = dateToDay.get(entry.date);
    if (idx !== undefined) {
      hours[idx] += entry.hours;
    }
  }

  return DAY_NAMES.map((day, i) => ({ day, hours: hours[i] }));
}

/**
 * Compute revenue by client from billable entries.
 */
export function computeRevenueByClient(
  entries: RevenueEntry[],
  projectToClient: Record<string, string>,
  rateMap: Record<string, number>
): ClientRevenue[] {
  if (entries.length === 0) return [];

  const totals = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.billable) continue;
    const clientId = projectToClient[entry.projectId];
    if (!clientId) continue;
    const rate = rateMap[entry.projectId] ?? 0;
    totals.set(clientId, (totals.get(clientId) ?? 0) + entry.hours * rate);
  }

  return Array.from(totals.entries())
    .map(([clientId, amount]) => ({ clientId, amount }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Compute aged receivables from outstanding invoices.
 * Buckets: Current (not yet due), 1-30 days overdue, 31-60, 60+
 */
export function computeAgedReceivables(
  invoices: AgingInvoice[],
  today: string
): AgeBucket[] {
  const todayMs = new Date(today + "T00:00:00").getTime();
  const buckets = [0, 0, 0, 0]; // Current, 1-30, 31-60, 60+

  for (const inv of invoices) {
    if (inv.status === "paid" || inv.status === "void" || inv.status === "draft") continue;

    const dueMs = new Date(inv.dueDate + "T00:00:00").getTime();
    const daysOverdue = Math.floor((todayMs - dueMs) / 86400000);

    if (daysOverdue <= 0) {
      buckets[0] += inv.total;
    } else if (daysOverdue <= 30) {
      buckets[1] += inv.total;
    } else if (daysOverdue <= 60) {
      buckets[2] += inv.total;
    } else {
      buckets[3] += inv.total;
    }
  }

  return [
    { bucket: "Current", amount: buckets[0] },
    { bucket: "1-30", amount: buckets[1] },
    { bucket: "31-60", amount: buckets[2] },
    { bucket: "60+", amount: buckets[3] },
  ];
}
