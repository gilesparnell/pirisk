import { describe, it, expect } from "vitest";
import { computeDashboardStats } from "../dashboard-stats";

describe("computeDashboardStats", () => {
  const baseEntry = {
    id: "e1",
    userId: "u1",
    projectId: "p1",
    entryType: "manual",
    description: "work",
    nonBillableReason: null,
    mileageKm: null,
    invoiceId: null,
    createdAt: "2026-04-03T00:00:00Z",
    updatedAt: "2026-04-03T00:00:00Z",
  };

  it("returns zeroes when no entries or invoices", () => {
    const stats = computeDashboardStats([], [], [], {});
    expect(stats.todayHours).toBe(0);
    expect(stats.weekHours).toBe(0);
    expect(stats.unbilledAmount).toBe(0);
    expect(stats.outstandingAmount).toBe(0);
  });

  it("sums today hours from today entries", () => {
    const today = new Date().toISOString().split("T")[0];
    const entries = [
      { ...baseEntry, id: "e1", date: today, hours: 3, billable: true },
      { ...baseEntry, id: "e2", date: today, hours: 1.5, billable: true },
    ];
    const stats = computeDashboardStats(entries, entries, [], {});
    expect(stats.todayHours).toBe(4.5);
  });

  it("sums week hours from week entries", () => {
    const entries = [
      { ...baseEntry, id: "e1", date: "2026-04-01", hours: 3, billable: true },
      { ...baseEntry, id: "e2", date: "2026-04-02", hours: 5, billable: true },
    ];
    const stats = computeDashboardStats([], entries, [], {});
    expect(stats.weekHours).toBe(8);
  });

  it("calculates unbilled amount from billable entries without invoiceId", () => {
    const entries = [
      { ...baseEntry, id: "e1", date: "2026-04-01", hours: 4, billable: true, invoiceId: null },
      { ...baseEntry, id: "e2", date: "2026-04-02", hours: 2, billable: true, invoiceId: "inv-1" },
      { ...baseEntry, id: "e3", date: "2026-04-03", hours: 3, billable: false, invoiceId: null },
    ];
    const rateMap = { p1: 275 };
    const stats = computeDashboardStats([], entries, [], rateMap);
    // Only e1 is billable + uninvoiced: 4 * 275 = 1100
    expect(stats.unbilledAmount).toBe(1100);
  });

  it("calculates outstanding from sent/overdue invoices", () => {
    const invoices = [
      { id: "i1", status: "sent", total: 5500 },
      { id: "i2", status: "paid", total: 3300 },
      { id: "i3", status: "draft", total: 1100 },
      { id: "i4", status: "overdue", total: 2200 },
    ];
    const stats = computeDashboardStats([], [], invoices as any, {});
    // sent + overdue: 5500 + 2200 = 7700
    expect(stats.outstandingAmount).toBe(7700);
  });

  it("includes overdue invoices (sent + past due) in outstanding", () => {
    const invoices = [
      { id: "i1", status: "sent", total: 1000, dueDate: "2026-01-01" },
    ];
    const stats = computeDashboardStats([], [], invoices as any, {});
    expect(stats.outstandingAmount).toBe(1000);
  });
});
