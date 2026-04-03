"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ClientForm } from "./client-form";
import { ClientList } from "./client-list";

type Client = {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  rateType: string;
  rate: number;
  color: string;
};

export function ClientsPageShell({
  initialClients,
}: {
  initialClients: Client[];
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your clients and their rate structures
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      {showForm && <ClientForm onDone={() => setShowForm(false)} />}

      <ClientList
        clients={initialClients}
        onAddClick={() => setShowForm(true)}
      />
    </div>
  );
}
