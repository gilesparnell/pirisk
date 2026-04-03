import { describe, it, expect, beforeEach } from "vitest";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { sql } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import {
  createClient as createClientAction,
  getClientsByUser,
  updateClient,
  deleteClient,
  createProject,
  getProjectsByClient,
  updateProject,
} from "../clients";

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

  const now = new Date().toISOString();
  await db.run(sql`INSERT INTO users (id, email, name, created_at) VALUES ('user-1', 'test@example.com', 'Test', ${now})`);
}

describe("Client & Project Actions", () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(async () => {
    db = createTestDb();
    await setupTables(db);
  });

  describe("createClient", () => {
    it("creates a client with hourly rate", async () => {
      const client = await createClientAction(db, {
        userId: "user-1",
        name: "Acme Corp",
        rateType: "hourly",
        rate: 275,
      });
      expect(client).toBeDefined();
      expect(client!.name).toBe("Acme Corp");
      expect(client!.rateType).toBe("hourly");
      expect(client!.rate).toBe(275);
    });

    it("creates a client with daily rate", async () => {
      const client = await createClientAction(db, {
        userId: "user-1",
        name: "BuildCo",
        rateType: "daily",
        rate: 2200,
      });
      expect(client!.rateType).toBe("daily");
      expect(client!.rate).toBe(2200);
    });

    it("sets contact details", async () => {
      const client = await createClientAction(db, {
        userId: "user-1",
        name: "DevCorp",
        rateType: "hourly",
        rate: 300,
        contactName: "John Smith",
        contactEmail: "john@devcorp.com",
        contactPhone: "0412345678",
      });
      expect(client!.contactName).toBe("John Smith");
      expect(client!.contactEmail).toBe("john@devcorp.com");
    });
  });

  describe("getClientsByUser", () => {
    it("returns all clients for a user", async () => {
      await createClientAction(db, { userId: "user-1", name: "Client A", rateType: "hourly", rate: 275 });
      await createClientAction(db, { userId: "user-1", name: "Client B", rateType: "daily", rate: 2200 });

      const clients = await getClientsByUser(db, "user-1");
      expect(clients).toHaveLength(2);
    });

    it("does not return other users' clients", async () => {
      await createClientAction(db, { userId: "user-1", name: "My Client", rateType: "hourly", rate: 275 });
      const clients = await getClientsByUser(db, "other-user");
      expect(clients).toHaveLength(0);
    });
  });

  describe("updateClient", () => {
    it("updates client rate type from hourly to daily", async () => {
      const client = await createClientAction(db, {
        userId: "user-1",
        name: "Switch Corp",
        rateType: "hourly",
        rate: 275,
      });

      const updated = await updateClient(db, client!.id, "user-1", {
        rateType: "daily",
        rate: 2200,
      });
      expect(updated!.rateType).toBe("daily");
      expect(updated!.rate).toBe(2200);
    });
  });

  describe("createProject", () => {
    it("creates a project under a client", async () => {
      const client = await createClientAction(db, {
        userId: "user-1",
        name: "Acme Corp",
        rateType: "hourly",
        rate: 275,
      });

      const project = await createProject(db, {
        clientId: client!.id,
        name: "Tower Build Phase 1",
        code: "TB-001",
        budgetHours: 160,
      });
      expect(project).toBeDefined();
      expect(project!.name).toBe("Tower Build Phase 1");
      expect(project!.code).toBe("TB-001");
      expect(project!.budgetHours).toBe(160);
      expect(project!.status).toBe("active");
    });
  });

  describe("getProjectsByClient", () => {
    it("returns projects for a client", async () => {
      const client = await createClientAction(db, {
        userId: "user-1",
        name: "Acme",
        rateType: "hourly",
        rate: 275,
      });
      await createProject(db, { clientId: client!.id, name: "Project A" });
      await createProject(db, { clientId: client!.id, name: "Project B" });

      const projects = await getProjectsByClient(db, client!.id);
      expect(projects).toHaveLength(2);
    });
  });

  describe("updateProject", () => {
    it("updates project status to completed", async () => {
      const client = await createClientAction(db, {
        userId: "user-1",
        name: "Acme",
        rateType: "hourly",
        rate: 275,
      });
      const project = await createProject(db, {
        clientId: client!.id,
        name: "Done Project",
      });

      const updated = await updateProject(db, project!.id, {
        status: "completed",
      });
      expect(updated!.status).toBe("completed");
    });
  });

  describe("deleteClient", () => {
    it("deletes a client with no entries", async () => {
      const client = await createClientAction(db, {
        userId: "user-1",
        name: "Empty Corp",
        rateType: "hourly",
        rate: 275,
      });

      const result = await deleteClient(db, client!.id, "user-1");
      expect(result.success).toBe(true);

      const clients = await getClientsByUser(db, "user-1");
      expect(clients).toHaveLength(0);
    });

    it("refuses to delete a client with time entries", async () => {
      const client = await createClientAction(db, {
        userId: "user-1",
        name: "Busy Corp",
        rateType: "hourly",
        rate: 275,
      });
      const project = await createProject(db, {
        clientId: client!.id,
        name: "Active Project",
      });

      // Add an entry against this project
      const now = new Date().toISOString();
      await db.run(sql`INSERT INTO entries (id, user_id, project_id, date, hours, entry_type, billable, created_at, updated_at)
        VALUES ('entry-1', 'user-1', ${project!.id}, '2026-04-03', 4, 'manual', 1, ${now}, ${now})`);

      const result = await deleteClient(db, client!.id, "user-1");
      expect(result.success).toBe(false);
      expect(result.reason).toBe("Client has time entries and cannot be deleted");

      // Client should still exist
      const clients = await getClientsByUser(db, "user-1");
      expect(clients).toHaveLength(1);
    });

    it("does not delete another user's client", async () => {
      const client = await createClientAction(db, {
        userId: "user-1",
        name: "My Client",
        rateType: "hourly",
        rate: 275,
      });

      const result = await deleteClient(db, client!.id, "other-user");
      expect(result.success).toBe(false);

      // Client should still exist
      const clients = await getClientsByUser(db, "user-1");
      expect(clients).toHaveLength(1);
    });

    it("deletes associated projects when deleting a client", async () => {
      const client = await createClientAction(db, {
        userId: "user-1",
        name: "Gone Corp",
        rateType: "hourly",
        rate: 275,
      });
      await createProject(db, { clientId: client!.id, name: "Project A" });
      await createProject(db, { clientId: client!.id, name: "Project B" });

      const result = await deleteClient(db, client!.id, "user-1");
      expect(result.success).toBe(true);

      const projects = await getProjectsByClient(db, client!.id);
      expect(projects).toHaveLength(0);
    });
  });
});
