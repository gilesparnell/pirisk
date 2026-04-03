import { describe, it, expect, beforeEach } from "vitest";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { sql } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import {
  generateInvoiceNumber,
  createInvoice,
  getInvoicesByUser,
  updateInvoiceStatus,
  addLineItem,
  getLineItems,
  calculateInvoiceTotals,
} from "../invoices";

function createTestDb() {
  const client = createClient({ url: ":memory:" });
  return drizzle(client, { schema });
}

async function setupTables(db: ReturnType<typeof createTestDb>) {
  await db.run(sql`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT, image TEXT,
    role TEXT NOT NULL DEFAULT 'user', status TEXT NOT NULL DEFAULT 'active',
    last_login_at TEXT, created_at TEXT NOT NULL
  )`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
    contact_name TEXT, contact_email TEXT, contact_phone TEXT,
    rate_type TEXT NOT NULL DEFAULT 'hourly', rate REAL NOT NULL DEFAULT 275,
    color TEXT NOT NULL DEFAULT '#2D7A7C', xero_contact_id TEXT,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, client_id TEXT NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'draft',
    issue_date TEXT NOT NULL, due_date TEXT NOT NULL,
    subtotal REAL NOT NULL DEFAULT 0, gst REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0, notes TEXT, xero_invoice_id TEXT, paid_at TEXT,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS invoice_line_items (
    id TEXT PRIMARY KEY, invoice_id TEXT NOT NULL,
    description TEXT NOT NULL, quantity REAL NOT NULL,
    quantity_unit TEXT NOT NULL DEFAULT 'hours',
    unit_price REAL NOT NULL, amount REAL NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS sequences (
    entity TEXT PRIMARY KEY, value INTEGER NOT NULL DEFAULT 0
  )`);

  const now = new Date().toISOString();
  await db.run(sql`INSERT INTO users (id, email, name, created_at) VALUES ('user-1', 'test@example.com', 'Test', ${now})`);
  await db.run(sql`INSERT INTO clients (id, user_id, name, rate, rate_type, created_at, updated_at) VALUES ('client-1', 'user-1', 'Acme', 275, 'hourly', ${now}, ${now})`);
}

describe("Invoice Actions", () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(async () => {
    db = createTestDb();
    await setupTables(db);
  });

  describe("generateInvoiceNumber", () => {
    it("generates sequential invoice numbers with prefix", async () => {
      const num1 = await generateInvoiceNumber(db, "INV", "2026-04");
      expect(num1).toBe("INV-202604-001");

      const num2 = await generateInvoiceNumber(db, "INV", "2026-04");
      expect(num2).toBe("INV-202604-002");
    });

    it("resets sequence per month", async () => {
      await generateInvoiceNumber(db, "INV", "2026-03");
      const num = await generateInvoiceNumber(db, "INV", "2026-04");
      expect(num).toBe("INV-202604-001");
    });
  });

  describe("createInvoice", () => {
    it("creates a draft invoice", async () => {
      const invoice = await createInvoice(db, {
        userId: "user-1",
        clientId: "client-1",
        invoicePrefix: "INV",
        issueDate: "2026-04-03",
        dueDate: "2026-05-03",
      });
      expect(invoice).toBeDefined();
      expect(invoice!.status).toBe("draft");
      expect(invoice!.invoiceNumber).toMatch(/^INV-202604-\d{3}$/);
    });
  });

  describe("getInvoicesByUser", () => {
    it("returns all invoices for a user", async () => {
      await createInvoice(db, {
        userId: "user-1",
        clientId: "client-1",
        invoicePrefix: "INV",
        issueDate: "2026-04-03",
        dueDate: "2026-05-03",
      });
      await createInvoice(db, {
        userId: "user-1",
        clientId: "client-1",
        invoicePrefix: "INV",
        issueDate: "2026-04-10",
        dueDate: "2026-05-10",
      });

      const invoices = await getInvoicesByUser(db, "user-1");
      expect(invoices).toHaveLength(2);
    });
  });

  describe("updateInvoiceStatus", () => {
    it("transitions invoice from draft to sent", async () => {
      const invoice = await createInvoice(db, {
        userId: "user-1",
        clientId: "client-1",
        invoicePrefix: "INV",
        issueDate: "2026-04-03",
        dueDate: "2026-05-03",
      });

      const updated = await updateInvoiceStatus(
        db,
        invoice!.id,
        "user-1",
        "sent"
      );
      expect(updated!.status).toBe("sent");
    });

    it("sets paidAt when marking as paid", async () => {
      const invoice = await createInvoice(db, {
        userId: "user-1",
        clientId: "client-1",
        invoicePrefix: "INV",
        issueDate: "2026-04-03",
        dueDate: "2026-05-03",
      });

      const updated = await updateInvoiceStatus(
        db,
        invoice!.id,
        "user-1",
        "paid"
      );
      expect(updated!.status).toBe("paid");
      expect(updated!.paidAt).toBeDefined();
    });
  });

  describe("Line Items", () => {
    it("adds a time-based line item", async () => {
      const invoice = await createInvoice(db, {
        userId: "user-1",
        clientId: "client-1",
        invoicePrefix: "INV",
        issueDate: "2026-04-03",
        dueDate: "2026-05-03",
      });

      const item = await addLineItem(db, {
        invoiceId: invoice!.id,
        description: "Contract review - Tower Build",
        quantity: 8,
        quantityUnit: "hours",
        unitPrice: 275,
      });
      expect(item).toBeDefined();
      expect(item!.amount).toBe(2200);
      expect(item!.quantityUnit).toBe("hours");
    });

    it("adds a mileage line item", async () => {
      const invoice = await createInvoice(db, {
        userId: "user-1",
        clientId: "client-1",
        invoicePrefix: "INV",
        issueDate: "2026-04-03",
        dueDate: "2026-05-03",
      });

      const item = await addLineItem(db, {
        invoiceId: invoice!.id,
        description: "Travel to site",
        quantity: 90,
        quantityUnit: "km",
        unitPrice: 0.91,
      });
      expect(item!.amount).toBeCloseTo(81.9);
      expect(item!.quantityUnit).toBe("km");
    });

    it("retrieves line items for an invoice", async () => {
      const invoice = await createInvoice(db, {
        userId: "user-1",
        clientId: "client-1",
        invoicePrefix: "INV",
        issueDate: "2026-04-03",
        dueDate: "2026-05-03",
      });
      await addLineItem(db, {
        invoiceId: invoice!.id,
        description: "Item 1",
        quantity: 4,
        quantityUnit: "hours",
        unitPrice: 275,
      });
      await addLineItem(db, {
        invoiceId: invoice!.id,
        description: "Item 2",
        quantity: 2,
        quantityUnit: "hours",
        unitPrice: 275,
      });

      const items = await getLineItems(db, invoice!.id);
      expect(items).toHaveLength(2);
    });
  });

  describe("calculateInvoiceTotals", () => {
    it("calculates subtotal, GST (10%), and total", async () => {
      const invoice = await createInvoice(db, {
        userId: "user-1",
        clientId: "client-1",
        invoicePrefix: "INV",
        issueDate: "2026-04-03",
        dueDate: "2026-05-03",
      });
      await addLineItem(db, {
        invoiceId: invoice!.id,
        description: "Work",
        quantity: 8,
        quantityUnit: "hours",
        unitPrice: 275,
      });
      await addLineItem(db, {
        invoiceId: invoice!.id,
        description: "Travel",
        quantity: 100,
        quantityUnit: "km",
        unitPrice: 0.91,
      });

      const updated = await calculateInvoiceTotals(db, invoice!.id, 0.1);
      // 8*275 = 2200 + 100*0.91 = 91 = subtotal 2291
      // GST = 229.10
      // Total = 2520.10
      expect(updated!.subtotal).toBeCloseTo(2291);
      expect(updated!.gst).toBeCloseTo(229.1);
      expect(updated!.total).toBeCloseTo(2520.1);
    });
  });
});
