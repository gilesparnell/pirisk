import { describe, it, expect, beforeEach } from "vitest";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { sql } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import {
  createEntry,
  getEntriesByDate,
  getEntriesByDateRange,
  updateEntry,
  deleteEntry,
} from "../entries";

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
  await db.run(sql`CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY, client_id TEXT NOT NULL, name TEXT NOT NULL,
    code TEXT, status TEXT NOT NULL DEFAULT 'active', budget_hours REAL,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, project_id TEXT NOT NULL,
    date TEXT NOT NULL, hours REAL NOT NULL, description TEXT,
    entry_type TEXT NOT NULL DEFAULT 'manual', billable INTEGER NOT NULL DEFAULT 1,
    non_billable_reason TEXT, mileage_km REAL, invoice_id TEXT,
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

  // Seed test data
  const now = new Date().toISOString();
  await db.run(sql`INSERT INTO users (id, email, name, created_at) VALUES ('user-1', 'test@example.com', 'Test User', ${now})`);
  await db.run(sql`INSERT INTO clients (id, user_id, name, rate, created_at, updated_at) VALUES ('client-1', 'user-1', 'Acme Corp', 275, ${now}, ${now})`);
  await db.run(sql`INSERT INTO projects (id, client_id, name, created_at, updated_at) VALUES ('project-1', 'client-1', 'Tower Build', ${now}, ${now})`);
}

describe("Entry Actions", () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(async () => {
    db = createTestDb();
    await setupTables(db);
  });

  describe("createEntry", () => {
    it("creates a manual time entry", async () => {
      const entry = await createEntry(db, {
        userId: "user-1",
        projectId: "project-1",
        date: "2026-04-03",
        hours: 4.5,
        description: "Contract review for stage 2",
        entryType: "manual",
        billable: true,
      });
      expect(entry).toBeDefined();
      expect(entry!.hours).toBe(4.5);
      expect(entry!.description).toBe("Contract review for stage 2");
      expect(entry!.billable).toBe(true);
      expect(entry!.entryType).toBe("manual");
    });

    it("creates a voice entry", async () => {
      const entry = await createEntry(db, {
        userId: "user-1",
        projectId: "project-1",
        date: "2026-04-03",
        hours: 2,
        description: "Site inspection and progress photos",
        entryType: "voice",
        billable: true,
      });
      expect(entry!.entryType).toBe("voice");
    });

    it("creates a non-billable entry with reason", async () => {
      const entry = await createEntry(db, {
        userId: "user-1",
        projectId: "project-1",
        date: "2026-04-03",
        hours: 1,
        description: "Internal admin",
        entryType: "manual",
        billable: false,
        nonBillableReason: "Internal meeting",
      });
      expect(entry!.billable).toBe(false);
      expect(entry!.nonBillableReason).toBe("Internal meeting");
    });

    it("creates an entry with mileage", async () => {
      const entry = await createEntry(db, {
        userId: "user-1",
        projectId: "project-1",
        date: "2026-04-03",
        hours: 0.5,
        description: "Travel to site",
        entryType: "manual",
        billable: true,
        mileageKm: 45,
      });
      expect(entry!.mileageKm).toBe(45);
    });
  });

  describe("getEntriesByDate", () => {
    it("returns entries for a specific date", async () => {
      await createEntry(db, {
        userId: "user-1",
        projectId: "project-1",
        date: "2026-04-03",
        hours: 4,
        description: "Morning work",
        entryType: "manual",
        billable: true,
      });
      await createEntry(db, {
        userId: "user-1",
        projectId: "project-1",
        date: "2026-04-03",
        hours: 3,
        description: "Afternoon work",
        entryType: "manual",
        billable: true,
      });
      await createEntry(db, {
        userId: "user-1",
        projectId: "project-1",
        date: "2026-04-04",
        hours: 8,
        description: "Next day",
        entryType: "manual",
        billable: true,
      });

      const entries = await getEntriesByDate(db, "user-1", "2026-04-03");
      expect(entries).toHaveLength(2);
    });

    it("returns empty array when no entries exist", async () => {
      const entries = await getEntriesByDate(db, "user-1", "2026-01-01");
      expect(entries).toHaveLength(0);
    });
  });

  describe("getEntriesByDateRange", () => {
    it("returns entries within a date range", async () => {
      await createEntry(db, {
        userId: "user-1",
        projectId: "project-1",
        date: "2026-04-01",
        hours: 8,
        description: "Day 1",
        entryType: "manual",
        billable: true,
      });
      await createEntry(db, {
        userId: "user-1",
        projectId: "project-1",
        date: "2026-04-03",
        hours: 6,
        description: "Day 3",
        entryType: "manual",
        billable: true,
      });
      await createEntry(db, {
        userId: "user-1",
        projectId: "project-1",
        date: "2026-04-10",
        hours: 4,
        description: "Day 10",
        entryType: "manual",
        billable: true,
      });

      const entries = await getEntriesByDateRange(
        db,
        "user-1",
        "2026-04-01",
        "2026-04-05"
      );
      expect(entries).toHaveLength(2);
    });
  });

  describe("updateEntry", () => {
    it("updates entry hours and description", async () => {
      const entry = await createEntry(db, {
        userId: "user-1",
        projectId: "project-1",
        date: "2026-04-03",
        hours: 4,
        description: "Original",
        entryType: "manual",
        billable: true,
      });

      const updated = await updateEntry(db, entry!.id, "user-1", {
        hours: 6,
        description: "Updated description",
      });
      expect(updated!.hours).toBe(6);
      expect(updated!.description).toBe("Updated description");
    });

    it("returns undefined when entry does not belong to user", async () => {
      const entry = await createEntry(db, {
        userId: "user-1",
        projectId: "project-1",
        date: "2026-04-03",
        hours: 4,
        description: "Test",
        entryType: "manual",
        billable: true,
      });

      const result = await updateEntry(db, entry!.id, "wrong-user", {
        hours: 10,
      });
      expect(result).toBeUndefined();
    });
  });

  describe("deleteEntry", () => {
    it("deletes an entry", async () => {
      const entry = await createEntry(db, {
        userId: "user-1",
        projectId: "project-1",
        date: "2026-04-03",
        hours: 4,
        description: "To delete",
        entryType: "manual",
        billable: true,
      });

      const result = await deleteEntry(db, entry!.id, "user-1");
      expect(result.success).toBe(true);

      const entries = await getEntriesByDate(db, "user-1", "2026-04-03");
      expect(entries).toHaveLength(0);
    });

    it("returns error when entry does not belong to user", async () => {
      const entry = await createEntry(db, {
        userId: "user-1",
        projectId: "project-1",
        date: "2026-04-03",
        hours: 4,
        description: "Not yours",
        entryType: "manual",
        billable: true,
      });

      const result = await deleteEntry(db, entry!.id, "wrong-user");
      expect(result.success).toBe(false);
    });
  });
});
