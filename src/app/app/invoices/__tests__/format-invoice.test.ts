import { describe, it, expect } from "vitest";
import { formatCurrency, formatInvoiceDate } from "../format-invoice";

describe("formatCurrency", () => {
  it("formats whole numbers with two decimals", () => {
    expect(formatCurrency(1000)).toBe("$1,000.00");
  });

  it("formats cents correctly", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats large amounts with commas", () => {
    expect(formatCurrency(67500)).toBe("$67,500.00");
  });
});

describe("formatInvoiceDate", () => {
  it("formats ISO date as dd/mm/yyyy", () => {
    expect(formatInvoiceDate("2026-04-04")).toBe("04/04/2026");
  });

  it("handles single-digit months and days", () => {
    expect(formatInvoiceDate("2026-01-09")).toBe("09/01/2026");
  });
});
