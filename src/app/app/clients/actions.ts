"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createClient as dbCreateClient,
  getClientsByUser,
  updateClient as dbUpdateClient,
  deleteClient as dbDeleteClient,
  createProject as dbCreateProject,
  getProjectsByClient,
} from "@/lib/actions/clients";
import { revalidatePath } from "next/cache";
import { validateClientForm } from "./validate-client";

async function getAuthUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

export async function fetchClients() {
  const userId = await getAuthUserId();
  return getClientsByUser(db, userId);
}

export async function fetchProjectsForClient(clientId: string) {
  return getProjectsByClient(db, clientId);
}

export type ActionResult = {
  success: boolean;
  error?: string;
  errors?: Record<string, string>;
};

export async function addClient(formData: FormData): Promise<ActionResult> {
  const userId = await getAuthUserId();

  const data = {
    name: formData.get("name") as string ?? "",
    rateType: formData.get("rateType") as string ?? "hourly",
    rate: formData.get("rate") as string ?? "275",
    contactName: formData.get("contactName") as string ?? "",
    contactEmail: formData.get("contactEmail") as string ?? "",
    contactPhone: formData.get("contactPhone") as string ?? "",
  };

  const errors = validateClientForm(data);
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  await dbCreateClient(db, {
    userId,
    name: data.name.trim(),
    rateType: data.rateType as "hourly" | "daily",
    rate: parseFloat(data.rate),
    contactName: data.contactName || undefined,
    contactEmail: data.contactEmail || undefined,
    contactPhone: data.contactPhone || undefined,
  });

  revalidatePath("/app/clients");
  return { success: true };
}

export async function editClient(
  clientId: string,
  formData: FormData
): Promise<ActionResult> {
  const userId = await getAuthUserId();

  const data = {
    name: formData.get("name") as string ?? "",
    rateType: formData.get("rateType") as string ?? "hourly",
    rate: formData.get("rate") as string ?? "275",
    contactName: formData.get("contactName") as string ?? "",
    contactEmail: formData.get("contactEmail") as string ?? "",
    contactPhone: formData.get("contactPhone") as string ?? "",
  };

  const errors = validateClientForm(data);
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const result = await dbUpdateClient(db, clientId, userId, {
    name: data.name.trim(),
    rateType: data.rateType as "hourly" | "daily",
    rate: parseFloat(data.rate),
    contactName: data.contactName || undefined,
    contactEmail: data.contactEmail || undefined,
    contactPhone: data.contactPhone || undefined,
  });

  if (!result) {
    return { success: false, error: "Client not found or access denied" };
  }

  revalidatePath("/app/clients");
  return { success: true };
}

export async function removeClient(clientId: string): Promise<ActionResult> {
  const userId = await getAuthUserId();
  const result = await dbDeleteClient(db, clientId, userId);
  if (!result.success) {
    return { success: false, error: result.reason ?? "Cannot delete client" };
  }
  revalidatePath("/app/clients");
  return { success: true };
}

export async function addProject(
  clientId: string,
  formData: FormData
): Promise<ActionResult> {
  await getAuthUserId();

  const name = (formData.get("name") as string ?? "").trim();
  if (!name) {
    return { success: false, errors: { name: "Project name is required" } };
  }

  await dbCreateProject(db, {
    clientId,
    name,
    code: (formData.get("code") as string) || undefined,
  });

  revalidatePath("/app/clients");
  return { success: true };
}
