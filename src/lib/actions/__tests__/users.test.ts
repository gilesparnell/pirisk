import { describe, it, expect, beforeEach } from "vitest";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { sql } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import {
  isEmailAllowed,
  upsertUser,
  getUserByEmail,
  addAllowedEmail,
  removeAllowedEmail,
  getAllowedEmails,
} from "../users";

function createTestDb() {
  const client = createClient({ url: ":memory:" });
  return drizzle(client, { schema });
}

async function setupTables(db: ReturnType<typeof createTestDb>) {
  await db.run(sql`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    image TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    status TEXT NOT NULL DEFAULT 'active',
    last_login_at TEXT,
    created_at TEXT NOT NULL
  )`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS allowed_emails (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    added_by TEXT,
    created_at TEXT NOT NULL
  )`);
}

describe("User Actions", () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(async () => {
    db = createTestDb();
    await setupTables(db);
  });

  // ── isEmailAllowed ──

  describe("isEmailAllowed", () => {
    it("returns false when email is not in allowlist", async () => {
      const result = await isEmailAllowed(db, "unknown@example.com");
      expect(result).toBe(false);
    });

    it("returns true when email is in allowlist", async () => {
      await addAllowedEmail(db, "allowed@example.com");
      const result = await isEmailAllowed(db, "allowed@example.com");
      expect(result).toBe(true);
    });

    it("is case-insensitive", async () => {
      await addAllowedEmail(db, "User@Example.COM");
      const result = await isEmailAllowed(db, "user@example.com");
      expect(result).toBe(true);
    });
  });

  // ── upsertUser ──

  describe("upsertUser", () => {
    it("creates a new user on first login", async () => {
      await addAllowedEmail(db, "new@example.com");
      const user = await upsertUser(db, {
        email: "new@example.com",
        name: "New User",
      });
      expect(user).toBeDefined();
      expect(user!.email).toBe("new@example.com");
      expect(user!.name).toBe("New User");
      expect(user!.role).toBe("user");
      expect(user!.status).toBe("active");
    });

    it("updates existing user on subsequent login", async () => {
      await addAllowedEmail(db, "existing@example.com");
      await upsertUser(db, {
        email: "existing@example.com",
        name: "Old Name",
      });
      const updated = await upsertUser(db, {
        email: "existing@example.com",
        name: "New Name",
        image: "https://example.com/photo.jpg",
      });
      expect(updated!.name).toBe("New Name");
      expect(updated!.image).toBe("https://example.com/photo.jpg");
    });

    it("sets lastLoginAt on upsert", async () => {
      const user = await upsertUser(db, {
        email: "login@example.com",
        name: "Login User",
      });
      expect(user!.lastLoginAt).toBeDefined();
    });
  });

  // ── getUserByEmail ──

  describe("getUserByEmail", () => {
    it("returns undefined for non-existent email", async () => {
      const user = await getUserByEmail(db, "nope@example.com");
      expect(user).toBeUndefined();
    });

    it("returns user for existing email", async () => {
      await upsertUser(db, { email: "find@example.com", name: "Find Me" });
      const user = await getUserByEmail(db, "find@example.com");
      expect(user).toBeDefined();
      expect(user!.email).toBe("find@example.com");
    });
  });

  // ── Allowlist management ──

  describe("addAllowedEmail", () => {
    it("adds an email to the allowlist", async () => {
      const result = await addAllowedEmail(db, "new@example.com");
      expect(result.success).toBe(true);
      const all = await getAllowedEmails(db);
      expect(all).toHaveLength(1);
      expect(all[0].email).toBe("new@example.com");
    });

    it("rejects duplicate emails", async () => {
      await addAllowedEmail(db, "dupe@example.com");
      const result = await addAllowedEmail(db, "dupe@example.com");
      expect(result.success).toBe(false);
    });

    it("normalizes email to lowercase", async () => {
      await addAllowedEmail(db, "UPPER@EXAMPLE.COM");
      const all = await getAllowedEmails(db);
      expect(all[0].email).toBe("upper@example.com");
    });
  });

  describe("removeAllowedEmail", () => {
    it("removes an email from the allowlist", async () => {
      await addAllowedEmail(db, "remove@example.com");
      const all = await getAllowedEmails(db);
      await removeAllowedEmail(db, all[0].id);
      const after = await getAllowedEmails(db);
      expect(after).toHaveLength(0);
    });
  });
});
