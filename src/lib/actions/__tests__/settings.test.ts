import { describe, it, expect, beforeEach } from "vitest";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { sql } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import {
  getOrCreateProfile,
  updateProfile,
  type UpdateProfileInput,
} from "../settings";

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
  await db.run(sql`CREATE TABLE IF NOT EXISTS business_profiles (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, business_name TEXT NOT NULL DEFAULT '',
    abn TEXT, address TEXT, phone TEXT, email TEXT, logo_url TEXT,
    standard_day_hours REAL NOT NULL DEFAULT 8, mileage_rate REAL NOT NULL DEFAULT 0.91,
    gst_rate REAL NOT NULL DEFAULT 0.1, invoice_prefix TEXT NOT NULL DEFAULT 'INV',
    payment_terms_days INTEGER NOT NULL DEFAULT 30,
    bank_name TEXT, bank_bsb TEXT, bank_account TEXT,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`);

  const now = new Date().toISOString();
  await db.run(sql`INSERT INTO users (id, email, name, created_at) VALUES ('user-1', 'test@example.com', 'Test', ${now})`);
}

describe("Settings / Business Profile Actions", () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(async () => {
    db = createTestDb();
    await setupTables(db);
  });

  describe("getOrCreateProfile", () => {
    it("creates a default profile when none exists", async () => {
      const profile = await getOrCreateProfile(db, "user-1");
      expect(profile).toBeDefined();
      expect(profile.userId).toBe("user-1");
      expect(profile.businessName).toBe("");
      expect(profile.standardDayHours).toBe(8);
      expect(profile.mileageRate).toBe(0.91);
      expect(profile.gstRate).toBe(0.1);
      expect(profile.invoicePrefix).toBe("INV");
      expect(profile.paymentTermsDays).toBe(30);
    });

    it("returns existing profile on second call", async () => {
      const first = await getOrCreateProfile(db, "user-1");
      const second = await getOrCreateProfile(db, "user-1");
      expect(first.id).toBe(second.id);
    });
  });

  describe("updateProfile", () => {
    it("updates business name and ABN", async () => {
      const profile = await getOrCreateProfile(db, "user-1");
      const updated = await updateProfile(db, profile.id, "user-1", {
        businessName: "PiRisk Management",
        abn: "12 345 678 901",
      });
      expect(updated).toBeDefined();
      expect(updated!.businessName).toBe("PiRisk Management");
      expect(updated!.abn).toBe("12 345 678 901");
    });

    it("updates bank details", async () => {
      const profile = await getOrCreateProfile(db, "user-1");
      const updated = await updateProfile(db, profile.id, "user-1", {
        bankName: "Commonwealth Bank",
        bankBsb: "062-000",
        bankAccount: "1234 5678",
      });
      expect(updated!.bankName).toBe("Commonwealth Bank");
      expect(updated!.bankBsb).toBe("062-000");
      expect(updated!.bankAccount).toBe("1234 5678");
    });

    it("updates invoice settings", async () => {
      const profile = await getOrCreateProfile(db, "user-1");
      const updated = await updateProfile(db, profile.id, "user-1", {
        standardDayHours: 7.5,
        mileageRate: 0.85,
        gstRate: 0.1,
        invoicePrefix: "PI",
        paymentTermsDays: 14,
      });
      expect(updated!.standardDayHours).toBe(7.5);
      expect(updated!.mileageRate).toBe(0.85);
      expect(updated!.invoicePrefix).toBe("PI");
      expect(updated!.paymentTermsDays).toBe(14);
    });

    it("updates contact details", async () => {
      const profile = await getOrCreateProfile(db, "user-1");
      const updated = await updateProfile(db, profile.id, "user-1", {
        address: "123 Main St, Sydney",
        phone: "+61 400 000 000",
        email: "test@example.com",
      });
      expect(updated!.address).toBe("123 Main St, Sydney");
      expect(updated!.phone).toBe("+61 400 000 000");
      expect(updated!.email).toBe("test@example.com");
    });

    it("returns undefined for wrong user", async () => {
      const profile = await getOrCreateProfile(db, "user-1");
      const updated = await updateProfile(db, profile.id, "other-user", {
        businessName: "Hacked",
      });
      expect(updated).toBeUndefined();
    });

    it("preserves unmodified fields", async () => {
      const profile = await getOrCreateProfile(db, "user-1");
      await updateProfile(db, profile.id, "user-1", {
        businessName: "PiRisk",
      });
      const updated = await updateProfile(db, profile.id, "user-1", {
        abn: "99 999 999 999",
      });
      expect(updated!.businessName).toBe("PiRisk");
      expect(updated!.abn).toBe("99 999 999 999");
    });
  });
});
