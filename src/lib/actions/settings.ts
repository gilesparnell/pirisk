"use server";

import { eq, and } from "drizzle-orm";
import { businessProfiles } from "@/lib/db/schema";
import type { DB } from "@/lib/db";

function generateId() {
  return crypto.randomUUID();
}

export type UpdateProfileInput = Partial<{
  businessName: string;
  abn: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
  standardDayHours: number;
  mileageRate: number;
  gstRate: number;
  invoicePrefix: string;
  paymentTermsDays: number;
  bankName: string;
  bankBsb: string;
  bankAccount: string;
}>;

export async function getOrCreateProfile(db: DB, userId: string) {
  const existing = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.userId, userId))
    .get();

  if (existing) return existing;

  const id = generateId();
  const now = new Date().toISOString();

  await db.insert(businessProfiles).values({
    id,
    userId,
    createdAt: now,
    updatedAt: now,
  });

  const created = await db.select().from(businessProfiles).where(eq(businessProfiles.id, id)).get();
  if (!created) throw new Error("Failed to create business profile");
  return created;
}

export async function updateProfile(
  db: DB,
  profileId: string,
  userId: string,
  data: UpdateProfileInput
) {
  const existing = await db
    .select()
    .from(businessProfiles)
    .where(
      and(
        eq(businessProfiles.id, profileId),
        eq(businessProfiles.userId, userId)
      )
    )
    .get();

  if (!existing) return undefined;

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (data.businessName !== undefined) updates.businessName = data.businessName;
  if (data.abn !== undefined) updates.abn = data.abn;
  if (data.address !== undefined) updates.address = data.address;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.email !== undefined) updates.email = data.email;
  if (data.logoUrl !== undefined) updates.logoUrl = data.logoUrl;
  if (data.standardDayHours !== undefined) updates.standardDayHours = data.standardDayHours;
  if (data.mileageRate !== undefined) updates.mileageRate = data.mileageRate;
  if (data.gstRate !== undefined) updates.gstRate = data.gstRate;
  if (data.invoicePrefix !== undefined) updates.invoicePrefix = data.invoicePrefix;
  if (data.paymentTermsDays !== undefined) updates.paymentTermsDays = data.paymentTermsDays;
  if (data.bankName !== undefined) updates.bankName = data.bankName;
  if (data.bankBsb !== undefined) updates.bankBsb = data.bankBsb;
  if (data.bankAccount !== undefined) updates.bankAccount = data.bankAccount;

  await db
    .update(businessProfiles)
    .set(updates)
    .where(eq(businessProfiles.id, profileId));

  return db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.id, profileId))
    .get();
}
