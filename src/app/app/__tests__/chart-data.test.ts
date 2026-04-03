import { describe, it, expect } from "vitest";
import {
  computeWeeklyHoursData,
  computeRevenueByClient,
  computeAgedReceivables,
} from "../chart-data";

// ── Weekly Hours Bar Chart ──────────────────────────────────

describe("computeWeeklyHoursData", () => {
  it("returns 7 days with zero hours when no entries", () => {
    const result = computeWeeklyHoursData([], "2026-03-30"); // Monday
    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ day: "Mon", hours: 0 });
    expect(result[6]).toEqual({ day: "Sun", hours: 0 });
  });

  it("sums hours per day correctly", () => {
    const entries = [
      { date: "2026-03-30", hours: 3, billable: true },
      { date: "2026-03-30", hours: 2, billable: true },
      { date: "2026-04-01", hours: 5, billable: false },
    ];
    const result = computeWeeklyHoursData(entries, "2026-03-30");
    expect(result[0]).toEqual({ day: "Mon", hours: 5 });
    expect(result[1]).toEqual({ day: "Tue", hours: 0 });
    expect(result[2]).toEqual({ day: "Wed", hours: 5 });
  });

  it("ignores entries outside the week", () => {
    const entries = [
      { date: "2026-03-29", hours: 8, billable: true }, // Sunday before
      { date: "2026-03-30", hours: 4, billable: true }, // Monday (in week)
    ];
    const result = computeWeeklyHoursData(entries, "2026-03-30");
    expect(result[0]).toEqual({ day: "Mon", hours: 4 });
    const total = result.reduce((s, d) => s + d.hours, 0);
    expect(total).toBe(4);
  });
});

// ── Revenue by Client Pie Chart ─────────────────────────────

describe("computeRevenueByClient", () => {
  it("returns empty array when no entries", () => {
    expect(computeRevenueByClient([], {}, {})).toEqual([]);
  });

  it("sums billable hours * rate per client", () => {
    const entries = [
      { projectId: "p1", hours: 4, billable: true, invoiceId: null },
      { projectId: "p2", hours: 3, billable: true, invoiceId: null },
      { projectId: "p1", hours: 2, billable: true, invoiceId: null },
    ];
    const projectToClient: Record<string, string> = { p1: "c1", p2: "c2" };
    const rateMap: Record<string, number> = { p1: 200, p2: 150 };
    const result = computeRevenueByClient(entries, projectToClient, rateMap);

    expect(result).toHaveLength(2);
    const c1 = result.find((r) => r.clientId === "c1");
    const c2 = result.find((r) => r.clientId === "c2");
    expect(c1?.amount).toBe(1200); // 6h * $200
    expect(c2?.amount).toBe(450); // 3h * $150
  });

  it("excludes non-billable entries", () => {
    const entries = [
      { projectId: "p1", hours: 4, billable: true, invoiceId: null },
      { projectId: "p1", hours: 2, billable: false, invoiceId: null },
    ];
    const result = computeRevenueByClient(
      entries,
      { p1: "c1" },
      { p1: 100 }
    );
    expect(result[0].amount).toBe(400);
  });

  it("sorts by amount descending", () => {
    const entries = [
      { projectId: "p1", hours: 1, billable: true, invoiceId: null },
      { projectId: "p2", hours: 10, billable: true, invoiceId: null },
    ];
    const result = computeRevenueByClient(
      entries,
      { p1: "c1", p2: "c2" },
      { p1: 100, p2: 100 }
    );
    expect(result[0].clientId).toBe("c2");
    expect(result[1].clientId).toBe("c1");
  });
});

// ── Aged Receivables ────────────────────────────────────────

describe("computeAgedReceivables", () => {
  const today = "2026-04-04";

  it("returns four buckets with zero when no invoices", () => {
    const result = computeAgedReceivables([], today);
    expect(result).toHaveLength(4);
    expect(result.every((b) => b.amount === 0)).toBe(true);
  });

  it("puts current invoices in 0-30 bucket", () => {
    const invoices = [
      { id: "i1", status: "sent", total: 5000, dueDate: "2026-04-20" },
    ];
    const result = computeAgedReceivables(invoices, today);
    expect(result[0]).toEqual({ bucket: "Current", amount: 5000 });
    expect(result[1].amount).toBe(0);
  });

  it("puts 15-day overdue invoice in 1-30 bucket", () => {
    const invoices = [
      { id: "i1", status: "sent", total: 3000, dueDate: "2026-03-20" },
    ];
    const result = computeAgedReceivables(invoices, today);
    expect(result[1]).toEqual({ bucket: "1-30", amount: 3000 });
  });

  it("puts 45-day overdue invoice in 31-60 bucket", () => {
    const invoices = [
      { id: "i1", status: "sent", total: 2000, dueDate: "2026-02-18" },
    ];
    const result = computeAgedReceivables(invoices, today);
    expect(result[2]).toEqual({ bucket: "31-60", amount: 2000 });
  });

  it("puts 90-day overdue invoice in 60+ bucket", () => {
    const invoices = [
      { id: "i1", status: "overdue", total: 1000, dueDate: "2026-01-04" },
    ];
    const result = computeAgedReceivables(invoices, today);
    expect(result[3]).toEqual({ bucket: "60+", amount: 1000 });
  });

  it("ignores paid and void invoices", () => {
    const invoices = [
      { id: "i1", status: "paid", total: 5000, dueDate: "2026-03-01" },
      { id: "i2", status: "void", total: 3000, dueDate: "2026-02-01" },
      { id: "i3", status: "sent", total: 1000, dueDate: "2026-04-10" },
    ];
    const result = computeAgedReceivables(invoices, today);
    const total = result.reduce((s, b) => s + b.amount, 0);
    expect(total).toBe(1000);
  });
});
