"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createInvoice as dbCreateInvoice,
  getInvoicesByUser,
  getInvoiceById as dbGetInvoiceById,
  updateInvoiceStatus as dbUpdateInvoiceStatus,
  addLineItem as dbAddLineItem,
  getLineItems as dbGetLineItems,
  calculateInvoiceTotals as dbCalculateInvoiceTotals,
} from "@/lib/actions/invoices";
import { getClientsByUser } from "@/lib/actions/clients";
import {
  getEntriesByDateRange,
} from "@/lib/actions/entries";
import { revalidatePath } from "next/cache";

async function getAuthUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

export type ActionResult = {
  success: boolean;
  error?: string;
};

export async function fetchInvoices() {
  const userId = await getAuthUserId();
  return getInvoicesByUser(db, userId);
}

export async function fetchClients() {
  const userId = await getAuthUserId();
  return getClientsByUser(db, userId);
}

export async function fetchInvoiceWithLineItems(invoiceId: string) {
  const invoice = await dbGetInvoiceById(db, invoiceId);
  if (!invoice) return null;
  const lineItems = await dbGetLineItems(db, invoiceId);
  return { invoice, lineItems };
}

export async function createInvoiceForClient(
  clientId: string,
  issueDate: string,
  dueDate: string,
  notes?: string
): Promise<ActionResult & { invoiceId?: string }> {
  const userId = await getAuthUserId();

  const invoice = await dbCreateInvoice(db, {
    userId,
    clientId,
    invoicePrefix: "INV",
    issueDate,
    dueDate,
    notes,
  });

  if (!invoice) {
    return { success: false, error: "Failed to create invoice" };
  }

  revalidatePath("/app/invoices");
  return { success: true, invoiceId: invoice.id };
}

export async function addInvoiceLineItem(
  invoiceId: string,
  description: string,
  quantity: number,
  quantityUnit: "hours" | "days" | "km",
  unitPrice: number,
  sortOrder?: number
): Promise<ActionResult> {
  await getAuthUserId();

  await dbAddLineItem(db, {
    invoiceId,
    description,
    quantity,
    quantityUnit,
    unitPrice,
    sortOrder,
  });

  await dbCalculateInvoiceTotals(db, invoiceId, 0.1);
  revalidatePath("/app/invoices");
  return { success: true };
}

export async function changeInvoiceStatus(
  invoiceId: string,
  status: "draft" | "sent" | "paid" | "overdue" | "void"
): Promise<ActionResult> {
  const userId = await getAuthUserId();
  const result = await dbUpdateInvoiceStatus(db, invoiceId, userId, status);
  if (!result) {
    return { success: false, error: "Invoice not found or access denied" };
  }
  revalidatePath("/app/invoices");
  return { success: true };
}
