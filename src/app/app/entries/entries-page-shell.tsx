"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { EntryForm } from "./entry-form";
import { EntryList } from "./entry-list";
import type { ClientWithProjects } from "./actions";

type Entry = {
  id: string;
  projectId: string;
  date: string;
  hours: number;
  description: string | null;
  entryType: string;
  billable: boolean;
  mileageKm: number | null;
  createdAt: string;
};

type ProjectInfo = {
  projectId: string;
  projectName: string;
  clientName: string;
};

export function EntriesPageShell({
  clients,
  todayEntries,
  projectMap,
}: {
  clients: ClientWithProjects[];
  todayEntries: Entry[];
  projectMap: Record<string, ProjectInfo>;
}) {
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(searchParams.get("new") === "1");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time Entries</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your billable hours and travel
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Entry
        </button>
      </div>

      {showForm && (
        <EntryForm clients={clients} onDone={() => setShowForm(false)} />
      )}

      <EntryList
        entries={todayEntries}
        projectMap={projectMap}
        onAddClick={() => setShowForm(true)}
      />
    </div>
  );
}
