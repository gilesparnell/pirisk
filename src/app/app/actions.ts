"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEntriesByDate, getEntriesByDateRange } from "@/lib/actions/entries";
import { getInvoicesByUser } from "@/lib/actions/invoices";
import { getClientsByUser, getProjectsByClient } from "@/lib/actions/clients";

async function getAuthUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export async function fetchDashboardData() {
  const userId = await getAuthUserId();

  const today = new Date().toISOString().split("T")[0];
  const monday = getMonday(new Date());
  const sunday = new Date(
    new Date(monday).getTime() + 6 * 86400000
  )
    .toISOString()
    .split("T")[0];

  const [todayEntries, weekEntries, invoices, clients] = await Promise.all([
    getEntriesByDate(db, userId, today),
    getEntriesByDateRange(db, userId, monday, sunday),
    getInvoicesByUser(db, userId),
    getClientsByUser(db, userId),
  ]);

  // Build projectId → rate lookup
  const rateMap: Record<string, number> = {};
  for (const client of clients) {
    const projects = await getProjectsByClient(db, client.id);
    for (const project of projects) {
      rateMap[project.id] = client.rate;
    }
  }

  // Build projectId → { projectName, clientName } for recent entries
  const projectMap: Record<string, { projectName: string; clientName: string }> = {};
  for (const client of clients) {
    const projects = await getProjectsByClient(db, client.id);
    for (const project of projects) {
      projectMap[project.id] = {
        projectName: project.name,
        clientName: client.name,
      };
    }
  }

  return {
    todayEntries,
    weekEntries,
    invoices,
    rateMap,
    projectMap,
    clients,
  };
}
