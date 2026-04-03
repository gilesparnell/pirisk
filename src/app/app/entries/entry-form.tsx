"use client";

import { useState, useTransition } from "react";
// useTransition used for save, useState for parse (to show errors)
import { Mic, Loader2 } from "lucide-react";
import {
  addEntry,
  addVoiceEntry,
  parseVoiceInput,
  type ClientWithProjects,
  type ActionResult,
} from "./actions";

export function EntryForm({
  clients,
  onDone,
}: {
  clients: ClientWithProjects[];
  onDone: () => void;
}) {
  const [voiceInput, setVoiceInput] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [mileageKm, setMileageKm] = useState("");
  const [billable, setBillable] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [parseStatus, setParseStatus] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const activeProjects =
    selectedClient?.projects.filter((p) => p.status === "active") ?? [];

  function handleClientChange(clientId: string) {
    setSelectedClientId(clientId);
    setSelectedProjectId("");
  }

  async function handleParse() {
    if (!voiceInput.trim()) return;
    setIsParsing(true);
    setParseStatus(null);
    try {
      const parsed = await parseVoiceInput(voiceInput);

      // Build a human-readable status
      const matched: string[] = [];
      const missed: string[] = [];

      if (parsed.hours > 0) {
        setHours(String(parsed.hours));
        matched.push(`${parsed.hours}h`);
      } else {
        missed.push("hours");
      }

      if (parsed.clientMatch) {
        setSelectedClientId(parsed.clientMatch);
        const client = clients.find((c) => c.id === parsed.clientMatch);
        matched.push(client?.name ?? "client");
        if (parsed.projectMatch) {
          setSelectedProjectId(parsed.projectMatch);
          const project = client?.projects.find((p) => p.id === parsed.projectMatch);
          matched.push(project?.name ?? "project");
        } else {
          missed.push("project");
        }
      } else {
        missed.push("client");
      }

      if (parsed.description) setDescription(parsed.description);
      if (parsed.mileageKm) {
        setMileageKm(String(parsed.mileageKm));
        matched.push(`${parsed.mileageKm}km`);
      }

      const parts: string[] = [];
      if (matched.length > 0) parts.push(`Matched: ${matched.join(", ")}`);
      if (missed.length > 0) parts.push(`Not found: ${missed.join(", ")}`);
      setParseStatus(parts.join(" · ") || "No matches found — select manually below");
    } catch (err) {
      setParseStatus(`Parse failed: ${err instanceof Error ? err.message : "unknown error"}`);
    } finally {
      setIsParsing(false);
    }
  }

  function handleVoiceKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleParse();
    }
  }

  async function handleSubmit(formData: FormData) {
    startSaving(async () => {
      const result: ActionResult = await addEntry(formData);
      if (result.success) {
        resetForm();
        onDone();
      } else if (result.errors) {
        setErrors(result.errors);
      }
    });
  }

  function resetForm() {
    setVoiceInput("");
    setSelectedClientId("");
    setSelectedProjectId("");
    setHours("");
    setDescription("");
    setMileageKm("");
    setBillable(true);
    setDate(new Date().toISOString().split("T")[0]);
    setErrors({});
  }

  return (
    <div className="mb-8 rounded-2xl bg-white border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Add Time Entry</h2>

      {/* Voice Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Mic className="inline h-4 w-4 mr-1 text-teal-600" />
          Voice / Quick Entry
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={voiceInput}
            onChange={(e) => setVoiceInput(e.target.value)}
            onKeyDown={handleVoiceKeyDown}
            placeholder='Try: "4 hours contract review for Acme Tower Build"'
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={handleParse}
            disabled={isParsing || !voiceInput.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {isParsing && <Loader2 className="h-4 w-4 animate-spin" />}
            Parse
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Use Wispr Flow to dictate, or type naturally. We&apos;ll parse the
          client, project, hours, and description.
        </p>
        {parseStatus && (
          <div
            className={`mt-2 rounded-lg px-3 py-2 text-xs ${
              parseStatus.includes("failed") || parseStatus.includes("No matches")
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-teal-50 text-teal-700 border border-teal-200"
            }`}
          >
            {parseStatus}
          </div>
        )}
      </div>

      <form action={handleSubmit}>
        <div className="border-t border-gray-100 pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                name="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              />
              {errors.date && (
                <p className="mt-1 text-xs text-red-600">{errors.date}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              >
                <option value="">Select client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project *
              </label>
              <select
                name="projectId"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-1 outline-none ${
                  errors.projectId
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                }`}
              >
                <option value="">Select project...</option>
                {activeProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <p className="mt-1 text-xs text-red-600">{errors.projectId}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hours *
              </label>
              <input
                name="hours"
                type="number"
                step="0.25"
                min="0"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0.00"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-1 outline-none ${
                  errors.hours
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                }`}
              />
              {errors.hours && (
                <p className="mt-1 text-xs text-red-600">{errors.hours}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none"
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mileage (km)
              </label>
              <input
                name="mileageKm"
                type="number"
                step="0.1"
                min="0"
                value={mileageKm}
                onChange={(e) => setMileageKm(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  name="billable"
                  type="checkbox"
                  checked={billable}
                  onChange={(e) => setBillable(e.target.checked)}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-gray-700">Billable</span>
              </label>
            </div>
            <div className="flex items-end justify-end gap-3">
              <button
                type="button"
                onClick={onDone}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Entry
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
