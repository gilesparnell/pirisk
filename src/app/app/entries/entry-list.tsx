"use client";

import { useState, useTransition } from "react";
import { Clock, Calendar, Trash2, Loader2, Pencil, Check, X } from "lucide-react";
import { removeEntry, editEntry } from "./actions";

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

export function EntryList({
  entries,
  projectMap,
  onAddClick,
}: {
  entries: Entry[];
  projectMap: Record<string, ProjectInfo>;
  onAddClick: () => void;
}) {
  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <h2 className="font-bold text-gray-900">Today</h2>
            <span className="text-sm text-gray-400">0 hours</span>
          </div>
        </div>
        <div className="p-12 text-center">
          <Clock className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-400 mb-4">
            No entries for today. Start tracking your time.
          </p>
          <button
            onClick={onAddClick}
            className="text-sm font-medium text-teal-600 hover:text-teal-700"
          >
            Add your first entry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-200">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-gray-400" />
          <h2 className="font-bold text-gray-900">Today</h2>
          <span className="text-sm text-gray-500">
            {totalHours.toFixed(1)} hours
          </span>
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {entries.map((entry) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            project={projectMap[entry.projectId]}
          />
        ))}
      </div>
    </div>
  );
}

function EntryRow({
  entry,
  project,
}: {
  entry: Entry;
  project?: ProjectInfo;
}) {
  const [isPending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editHours, setEditHours] = useState(String(entry.hours));
  const [editDescription, setEditDescription] = useState(entry.description ?? "");
  const [editMileage, setEditMileage] = useState(entry.mileageKm ? String(entry.mileageKm) : "");
  const [editBillable, setEditBillable] = useState(entry.billable);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  if (deleted) return null;

  function handleDelete() {
    if (!confirm("Delete this entry?")) return;
    startTransition(async () => {
      const result = await removeEntry(entry.id);
      if (result.success) setDeleted(true);
    });
  }

  function handleEditStart() {
    setEditHours(String(entry.hours));
    setEditDescription(entry.description ?? "");
    setEditMileage(entry.mileageKm ? String(entry.mileageKm) : "");
    setEditBillable(entry.billable);
    setEditErrors({});
    setEditing(true);
  }

  function handleEditCancel() {
    setEditing(false);
    setEditErrors({});
  }

  function handleEditSave() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("hours", editHours);
      formData.set("description", editDescription);
      if (editBillable) formData.set("billable", "on");
      formData.set("mileageKm", editMileage);

      const result = await editEntry(entry.id, formData);
      if (result.success) {
        setEditing(false);
        setEditErrors({});
      } else if (result.errors) {
        setEditErrors(result.errors);
      }
    });
  }

  if (editing) {
    return (
      <div className="px-6 py-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="font-medium text-gray-900">
            {project?.clientName ?? "Unknown Client"}
          </span>
          <span className="text-gray-300">&middot;</span>
          <span>{project?.projectName ?? "Unknown Project"}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Hours
            </label>
            <input
              type="number"
              step="0.25"
              min="0"
              value={editHours}
              onChange={(e) => setEditHours(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            {editErrors.hours && (
              <p className="text-xs text-red-600 mt-1">{editErrors.hours}</p>
            )}
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Description
            </label>
            <input
              type="text"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Mileage (km)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={editMileage}
              onChange={(e) => setEditMileage(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={editBillable}
                onChange={(e) => setEditBillable(e.target.checked)}
                className="rounded border-gray-300"
              />
              Billable
            </label>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleEditSave}
            disabled={isPending}
            className="bg-teal-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Save
          </button>
          <button
            onClick={handleEditCancel}
            disabled={isPending}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 text-sm">
            {project?.clientName ?? "Unknown Client"}
          </span>
          <span className="text-gray-300">&middot;</span>
          <span className="text-sm text-gray-600">
            {project?.projectName ?? "Unknown Project"}
          </span>
        </div>
        {entry.description && (
          <p className="text-sm text-gray-500 truncate mt-0.5">
            {entry.description}
          </p>
        )}
        {entry.mileageKm && (
          <p className="text-xs text-gray-400 mt-0.5">
            {entry.mileageKm} km travel
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            entry.billable
              ? "bg-green-50 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {entry.billable ? "Billable" : "Non-billable"}
        </span>
        <span className="font-mono text-sm font-semibold text-gray-900 w-16 text-right">
          {entry.hours.toFixed(1)}h
        </span>
        <button
          onClick={handleEditStart}
          className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
