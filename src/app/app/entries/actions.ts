"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createEntry as dbCreateEntry,
  getEntriesByDate,
  getEntriesByDateRange,
  updateEntry as dbUpdateEntry,
  deleteEntry as dbDeleteEntry,
} from "@/lib/actions/entries";
import {
  getClientsByUser,
  getProjectsByClient,
} from "@/lib/actions/clients";
import { parseVoiceEntry } from "@/lib/services/voice-parser";
import { revalidatePath } from "next/cache";
import { validateEntryForm, validateEditForm } from "./validate-entry";

async function getAuthUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

export type ClientWithProjects = {
  id: string;
  name: string;
  projects: { id: string; name: string; status: string }[];
};

export async function fetchClientsWithProjects(): Promise<ClientWithProjects[]> {
  const userId = await getAuthUserId();
  const clients = await getClientsByUser(db, userId);
  const result: ClientWithProjects[] = [];

  for (const client of clients) {
    const projects = await getProjectsByClient(db, client.id);
    result.push({
      id: client.id,
      name: client.name,
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
      })),
    });
  }

  return result;
}

export async function fetchEntriesForDate(date: string) {
  const userId = await getAuthUserId();
  return getEntriesByDate(db, userId, date);
}

export async function fetchEntriesByRange(startDate: string, endDate: string) {
  const userId = await getAuthUserId();
  return getEntriesByDateRange(db, userId, startDate, endDate);
}

export type ActionResult = {
  success: boolean;
  error?: string;
  errors?: Record<string, string>;
};

export async function addEntry(formData: FormData): Promise<ActionResult> {
  const userId = await getAuthUserId();

  const data = {
    projectId: (formData.get("projectId") as string) ?? "",
    date: (formData.get("date") as string) ?? "",
    hours: (formData.get("hours") as string) ?? "0",
    description: (formData.get("description") as string) ?? "",
    billable: formData.get("billable") === "on",
    mileageKm: (formData.get("mileageKm") as string) ?? "",
  };

  const errors = validateEntryForm(data);
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  await dbCreateEntry(db, {
    userId,
    projectId: data.projectId,
    date: data.date,
    hours: parseFloat(data.hours),
    description: data.description,
    entryType: "manual",
    billable: data.billable,
    mileageKm: data.mileageKm ? parseFloat(data.mileageKm) : undefined,
  });

  revalidatePath("/app/entries");
  revalidatePath("/app");
  return { success: true };
}

export async function addVoiceEntry(
  text: string,
  projectId: string,
  date: string,
  hours: number,
  description: string,
  billable: boolean,
  mileageKm: number | null
): Promise<ActionResult> {
  const userId = await getAuthUserId();

  if (!projectId) {
    return { success: false, errors: { projectId: "Please select a project" } };
  }
  if (hours <= 0) {
    return { success: false, errors: { hours: "Hours must be greater than zero" } };
  }

  await dbCreateEntry(db, {
    userId,
    projectId,
    date,
    hours,
    description,
    entryType: "voice",
    billable,
    mileageKm: mileageKm ?? undefined,
  });

  revalidatePath("/app/entries");
  revalidatePath("/app");
  return { success: true };
}

export async function parseVoiceInput(text: string) {
  const userId = await getAuthUserId();
  const clients = await getClientsByUser(db, userId);
  const clientsWithProjects: { id: string; name: string; projects: { id: string; name: string }[] }[] = [];

  for (const client of clients) {
    const projects = await getProjectsByClient(db, client.id);
    clientsWithProjects.push({
      id: client.id,
      name: client.name,
      projects: projects.map((p) => ({ id: p.id, name: p.name })),
    });
  }

  return parseVoiceEntry(text, clientsWithProjects);
}

export async function editEntry(
  entryId: string,
  formData: FormData
): Promise<ActionResult> {
  const userId = await getAuthUserId();
  const data = {
    hours: (formData.get("hours") as string) ?? "0",
    description: (formData.get("description") as string) ?? "",
    billable: formData.get("billable") === "on",
    mileageKm: (formData.get("mileageKm") as string) ?? "",
  };

  const errors = validateEditForm(data);
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const result = await dbUpdateEntry(db, entryId, userId, {
    hours: parseFloat(data.hours),
    description: data.description,
    billable: data.billable,
    mileageKm: data.mileageKm ? parseFloat(data.mileageKm) : undefined,
  });

  if (!result) {
    return { success: false, error: "Entry not found or access denied" };
  }

  revalidatePath("/app/entries");
  revalidatePath("/app");
  return { success: true };
}

export async function removeEntry(entryId: string): Promise<ActionResult> {
  const userId = await getAuthUserId();
  const result = await dbDeleteEntry(db, entryId, userId);
  if (!result.success) {
    return { success: false, error: "Entry not found or access denied" };
  }
  revalidatePath("/app/entries");
  revalidatePath("/app");
  return { success: true };
}
