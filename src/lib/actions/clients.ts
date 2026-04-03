"use server";

import { eq, and } from "drizzle-orm";
import { clients, projects, entries } from "@/lib/db/schema";
import type { DB } from "@/lib/db";

function generateId() {
  return crypto.randomUUID();
}

// ─── Clients ────────────────────────────────────────────────

export type CreateClientInput = {
  userId: string;
  name: string;
  rateType: "hourly" | "daily";
  rate: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  color?: string;
};

export async function createClient(db: DB, input: CreateClientInput) {
  const id = generateId();
  const now = new Date().toISOString();

  await db.insert(clients).values({
    id,
    userId: input.userId,
    name: input.name,
    rateType: input.rateType,
    rate: input.rate,
    contactName: input.contactName ?? null,
    contactEmail: input.contactEmail ?? null,
    contactPhone: input.contactPhone ?? null,
    color: input.color ?? "#2D7A7C",
    createdAt: now,
    updatedAt: now,
  });

  return db.select().from(clients).where(eq(clients.id, id)).get();
}

export async function getClientsByUser(db: DB, userId: string) {
  return db
    .select()
    .from(clients)
    .where(eq(clients.userId, userId))
    .orderBy(clients.name)
    .all();
}

export async function getClientById(db: DB, clientId: string) {
  return db.select().from(clients).where(eq(clients.id, clientId)).get();
}

export async function updateClient(
  db: DB,
  clientId: string,
  userId: string,
  data: Partial<{
    name: string;
    rateType: "hourly" | "daily";
    rate: number;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    color: string;
    xeroContactId: string;
  }>
) {
  const existing = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
    .get();

  if (!existing) return undefined;

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (data.name !== undefined) updates.name = data.name;
  if (data.rateType !== undefined) updates.rateType = data.rateType;
  if (data.rate !== undefined) updates.rate = data.rate;
  if (data.contactName !== undefined) updates.contactName = data.contactName;
  if (data.contactEmail !== undefined) updates.contactEmail = data.contactEmail;
  if (data.contactPhone !== undefined) updates.contactPhone = data.contactPhone;
  if (data.color !== undefined) updates.color = data.color;
  if (data.xeroContactId !== undefined)
    updates.xeroContactId = data.xeroContactId;

  await db.update(clients).set(updates).where(eq(clients.id, clientId));

  return db.select().from(clients).where(eq(clients.id, clientId)).get();
}

export async function deleteClient(
  db: DB,
  clientId: string,
  userId: string
): Promise<{ success: boolean; reason?: string }> {
  // Verify ownership
  const existing = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
    .get();

  if (!existing) return { success: false, reason: "Client not found" };

  // Check for entries against any of this client's projects
  const clientProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.clientId, clientId))
    .all();

  for (const project of clientProjects) {
    const entryCount = await db
      .select()
      .from(entries)
      .where(eq(entries.projectId, project.id))
      .all();
    if (entryCount.length > 0) {
      return {
        success: false,
        reason: "Client has time entries and cannot be deleted",
      };
    }
  }

  // Delete projects first, then client
  await db.delete(projects).where(eq(projects.clientId, clientId));
  await db.delete(clients).where(eq(clients.id, clientId));

  return { success: true };
}

// ─── Projects ───────────────────────────────────────────────

export type CreateProjectInput = {
  clientId: string;
  name: string;
  code?: string;
  budgetHours?: number;
};

export async function createProject(db: DB, input: CreateProjectInput) {
  const id = generateId();
  const now = new Date().toISOString();

  await db.insert(projects).values({
    id,
    clientId: input.clientId,
    name: input.name,
    code: input.code ?? null,
    budgetHours: input.budgetHours ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return db.select().from(projects).where(eq(projects.id, id)).get();
}

export async function getProjectsByClient(db: DB, clientId: string) {
  return db
    .select()
    .from(projects)
    .where(eq(projects.clientId, clientId))
    .orderBy(projects.name)
    .all();
}

export async function updateProject(
  db: DB,
  projectId: string,
  data: Partial<{
    name: string;
    code: string;
    status: "active" | "completed" | "on_hold";
    budgetHours: number;
  }>
) {
  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (data.name !== undefined) updates.name = data.name;
  if (data.code !== undefined) updates.code = data.code;
  if (data.status !== undefined) updates.status = data.status;
  if (data.budgetHours !== undefined) updates.budgetHours = data.budgetHours;

  await db.update(projects).set(updates).where(eq(projects.id, projectId));

  return db.select().from(projects).where(eq(projects.id, projectId)).get();
}
