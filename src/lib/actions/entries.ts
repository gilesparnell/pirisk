"use server";

import { eq, and, gte, lte } from "drizzle-orm";
import { entries } from "@/lib/db/schema";
import type { DB } from "@/lib/db";

function generateId() {
  return crypto.randomUUID();
}

export type CreateEntryInput = {
  userId: string;
  projectId: string;
  date: string;
  hours: number;
  description: string;
  entryType: "voice" | "manual" | "timer";
  billable: boolean;
  nonBillableReason?: string;
  mileageKm?: number;
};

export async function createEntry(db: DB, input: CreateEntryInput) {
  const id = generateId();
  const now = new Date().toISOString();

  await db.insert(entries).values({
    id,
    userId: input.userId,
    projectId: input.projectId,
    date: input.date,
    hours: input.hours,
    description: input.description ?? null,
    entryType: input.entryType,
    billable: input.billable,
    nonBillableReason: input.nonBillableReason ?? null,
    mileageKm: input.mileageKm ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return db.select().from(entries).where(eq(entries.id, id)).get();
}

export async function getEntriesByDate(
  db: DB,
  userId: string,
  date: string
) {
  return db
    .select()
    .from(entries)
    .where(and(eq(entries.userId, userId), eq(entries.date, date)))
    .all();
}

export async function getEntriesByDateRange(
  db: DB,
  userId: string,
  startDate: string,
  endDate: string
) {
  return db
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.userId, userId),
        gte(entries.date, startDate),
        lte(entries.date, endDate)
      )
    )
    .all();
}

export async function updateEntry(
  db: DB,
  entryId: string,
  userId: string,
  data: Partial<{
    hours: number;
    description: string;
    billable: boolean;
    nonBillableReason: string;
    mileageKm: number;
    projectId: string;
    date: string;
  }>
) {
  const existing = await db
    .select()
    .from(entries)
    .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
    .get();

  if (!existing) return undefined;

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (data.hours !== undefined) updates.hours = data.hours;
  if (data.description !== undefined) updates.description = data.description;
  if (data.billable !== undefined) updates.billable = data.billable;
  if (data.nonBillableReason !== undefined)
    updates.nonBillableReason = data.nonBillableReason;
  if (data.mileageKm !== undefined) updates.mileageKm = data.mileageKm;
  if (data.projectId !== undefined) updates.projectId = data.projectId;
  if (data.date !== undefined) updates.date = data.date;

  await db.update(entries).set(updates).where(eq(entries.id, entryId));

  return db.select().from(entries).where(eq(entries.id, entryId)).get();
}

export async function deleteEntry(
  db: DB,
  entryId: string,
  userId: string
): Promise<{ success: boolean }> {
  const existing = await db
    .select()
    .from(entries)
    .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
    .get();

  if (!existing) return { success: false };

  await db.delete(entries).where(eq(entries.id, entryId));
  return { success: true };
}
