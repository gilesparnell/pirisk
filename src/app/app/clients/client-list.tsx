"use client";

import { useState, useTransition } from "react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Plus,
  Loader2,
  FolderOpen,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import {
  addProject,
  editClient,
  removeClient,
  fetchProjectsForClient,
  type ActionResult,
} from "./actions";

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

type Project = {
  id: string;
  name: string;
  code: string | null;
  status: string;
};

export function ClientList({
  clients,
  onAddClick,
}: {
  clients: Client[];
  onAddClick: () => void;
}) {
  if (clients.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-gray-200">
        <div className="p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-400 mb-4">
            No clients yet. Add your first client to start tracking time.
          </p>
          <button
            onClick={onAddClick}
            className="text-sm font-medium text-teal-600 hover:text-teal-700"
          >
            Add your first client
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {clients.map((client) => (
        <ClientCard key={client.id} client={client} />
      ))}
    </div>
  );
}

function ClientCard({ client }: { client: Client }) {
  const [expanded, setExpanded] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (deleted) return null;

  async function handleExpand() {
    if (!expanded && !loaded) {
      const data = await fetchProjectsForClient(client.id);
      setProjects(data as Project[]);
      setLoaded(true);
    }
    setExpanded(!expanded);
  }

  async function handleAddProject(formData: FormData) {
    startTransition(async () => {
      const result: ActionResult = await addProject(client.id, formData);
      if (result.success) {
        setShowProjectForm(false);
        const data = await fetchProjectsForClient(client.id);
        setProjects(data as Project[]);
      }
    });
  }

  async function handleDelete() {
    if (!confirm(`Delete "${client.name}"? This cannot be undone.`)) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await removeClient(client.id);
      if (result.success) {
        setDeleted(true);
      } else {
        setDeleteError(result.error ?? "Cannot delete client");
      }
    });
  }

  async function handleEditSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await editClient(client.id, formData);
      if (result.success) {
        setEditing(false);
      }
    });
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
      <div className="flex items-center">
        <button
          onClick={handleExpand}
          className="flex-1 flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
        >
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: client.color }}
          >
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {client.name}
            </h3>
            <p className="text-sm text-gray-500">
              {client.contactName && `${client.contactName} · `}$
              {client.rate.toFixed(2)}/
              {client.rateType === "hourly" ? "hr" : "day"}
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {client.rateType}
          </span>
          {expanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </button>
        <div className="flex gap-1 pr-4">
          <button
            onClick={() => {
              setEditing(!editing);
              if (!expanded) handleExpand();
            }}
            title="Edit client"
            className="p-2 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            title="Delete client"
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {deleteError && (
        <div className="mx-5 mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 flex items-center justify-between">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError(null)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
          {/* Edit Form */}
          {editing && (
            <form action={handleEditSubmit} className="mb-4 pb-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Edit Client</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                  <input
                    name="name"
                    type="text"
                    defaultValue={client.name}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Contact Name</label>
                  <input
                    name="contactName"
                    type="text"
                    defaultValue={client.contactName ?? ""}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input
                    name="contactEmail"
                    type="email"
                    defaultValue={client.contactEmail ?? ""}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input
                    name="contactPhone"
                    type="tel"
                    defaultValue={client.contactPhone ?? ""}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rate Type</label>
                  <select
                    name="rateType"
                    defaultValue={client.rateType}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rate (AUD) *</label>
                  <input
                    name="rate"
                    type="number"
                    step="0.01"
                    defaultValue={client.rate}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {/* Contact details */}
          {!editing && (client.contactEmail || client.contactPhone) && (
            <div className="mb-4 flex gap-4 text-sm text-gray-500">
              {client.contactEmail && <span>{client.contactEmail}</span>}
              {client.contactPhone && <span>{client.contactPhone}</span>}
            </div>
          )}

          {/* Projects */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">Projects</h4>
            <button
              onClick={() => setShowProjectForm(!showProjectForm)}
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Project
            </button>
          </div>

          {showProjectForm && (
            <form action={handleAddProject} className="mb-3 flex gap-2">
              <input
                name="name"
                type="text"
                placeholder="Project name"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                autoFocus
              />
              <input
                name="code"
                type="text"
                placeholder="Code"
                className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              />
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Add"
                )}
              </button>
            </form>
          )}

          {projects.length === 0 ? (
            <p className="text-sm text-gray-400 flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              No projects yet
            </p>
          ) : (
            <ul className="space-y-1.5">
              {projects.map((project) => (
                <li
                  key={project.id}
                  className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm border border-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">
                      {project.name}
                    </span>
                    {project.code && (
                      <span className="text-xs text-gray-400">
                        {project.code}
                      </span>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      project.status === "active"
                        ? "bg-green-50 text-green-700"
                        : project.status === "completed"
                          ? "bg-gray-100 text-gray-500"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {project.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
