"use server";

import { eq, and, sql } from "drizzle-orm";
import {
  invoices,
  invoiceLineItems,
  sequences,
} from "@/lib/db/schema";
import type { DB } from "@/lib/db";

function generateId() {
  return crypto.randomUUID();
}

// ─── Invoice Number Generation ──────────────────────────────

export async function generateInvoiceNumber(
  db: DB,
  prefix: string,
  yearMonth: string
): Promise<string> {
  const entity = `invoice-${yearMonth}`;

  // Upsert sequence with atomic increment
  await db
    .insert(sequences)
    .values({ entity, value: 1 })
    .onConflictDoUpdate({
      target: sequences.entity,
      set: { value: sql`${sequences.value} + 1` },
    });

  const row = await db
    .select()
    .from(sequences)
    .where(eq(sequences.entity, entity))
    .get();

  const seq = String(row!.value).padStart(3, "0");
  const ym = yearMonth.replace("-", "");
  return `${prefix}-${ym}-${seq}`;
}

// ─── Invoices ───────────────────────────────────────────────

export type CreateInvoiceInput = {
  userId: string;
  clientId: string;
  invoicePrefix: string;
  issueDate: string;
  dueDate: string;
  notes?: string;
};

export async function createInvoice(db: DB, input: CreateInvoiceInput) {
  const id = generateId();
  const now = new Date().toISOString();
  const yearMonth = input.issueDate.slice(0, 7); // "2026-04"
  const invoiceNumber = await generateInvoiceNumber(
    db,
    input.invoicePrefix,
    yearMonth
  );

  await db.insert(invoices).values({
    id,
    userId: input.userId,
    clientId: input.clientId,
    invoiceNumber,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return db.select().from(invoices).where(eq(invoices.id, id)).get();
}

export async function getInvoicesByUser(db: DB, userId: string) {
  return db
    .select()
    .from(invoices)
    .where(eq(invoices.userId, userId))
    .orderBy(invoices.issueDate)
    .all();
}

export async function getInvoiceById(db: DB, invoiceId: string) {
  return db
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .get();
}

export async function updateInvoiceStatus(
  db: DB,
  invoiceId: string,
  userId: string,
  status: "draft" | "sent" | "paid" | "overdue" | "void"
) {
  const existing = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)))
    .get();

  if (!existing) return undefined;

  const updates: Record<string, unknown> = {
    status,
    updatedAt: new Date().toISOString(),
  };

  if (status === "paid") {
    updates.paidAt = new Date().toISOString();
  }

  await db.update(invoices).set(updates).where(eq(invoices.id, invoiceId));

  return db.select().from(invoices).where(eq(invoices.id, invoiceId)).get();
}

// ─── Line Items ─────────────────────────────────────────────

export type AddLineItemInput = {
  invoiceId: string;
  description: string;
  quantity: number;
  quantityUnit: "hours" | "days" | "km";
  unitPrice: number;
  sortOrder?: number;
};

export async function addLineItem(db: DB, input: AddLineItemInput) {
  const id = generateId();
  const amount = input.quantity * input.unitPrice;

  await db.insert(invoiceLineItems).values({
    id,
    invoiceId: input.invoiceId,
    description: input.description,
    quantity: input.quantity,
    quantityUnit: input.quantityUnit,
    unitPrice: input.unitPrice,
    amount,
    sortOrder: input.sortOrder ?? 0,
  });

  return db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.id, id))
    .get();
}

export async function getLineItems(db: DB, invoiceId: string) {
  return db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, invoiceId))
    .orderBy(invoiceLineItems.sortOrder)
    .all();
}

// ─── Totals ─────────────────────────────────────────────────

export async function calculateInvoiceTotals(
  db: DB,
  invoiceId: string,
  gstRate: number
) {
  const items = await getLineItems(db, invoiceId);
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const gst = subtotal * gstRate;
  const total = subtotal + gst;

  await db
    .update(invoices)
    .set({
      subtotal,
      gst,
      total,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(invoices.id, invoiceId));

  return db.select().from(invoices).where(eq(invoices.id, invoiceId)).get();
}
