"use client";

import { useState, useTransition, useEffect, useRef } from "react";
// useTransition used for save, useState for parse (to show errors)
import { Mic, MicOff, Loader2, Save } from "lucide-react";
import {
  addEntry,
  addVoiceEntry,
  parseVoiceInput,
  type ClientWithProjects,
  type ActionResult,
} from "./actions";
import { useSpeechRecognition } from "./use-speech-recognition";
import {
  getMissingFields,
  getConversationalPrompt,
  detectVoiceCommand,
  type ParsedEntryState,
} from "./voice-conversation";

export function EntryForm({
  clients,
  onDone,
  autoVoice = false,
}: {
  clients: ClientWithProjects[];
  onDone: () => void;
  autoVoice?: boolean;
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
  const [conversationPrompt, setConversationPrompt] = useState<string | null>(null);
  const [readyToSave, setReadyToSave] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Refs to keep current form values accessible inside async closures
  const hoursRef = useRef(hours);
  hoursRef.current = hours;
  const clientIdRef = useRef(selectedClientId);
  clientIdRef.current = selectedClientId;
  const projectIdRef = useRef(selectedProjectId);
  projectIdRef.current = selectedProjectId;
  const descriptionRef = useRef(description);
  descriptionRef.current = description;

  // Speech recognition with conversational flow
  const speech = useSpeechRecognition((transcript) => {
    setVoiceInput(transcript);
    if (transcript.trim()) {
      setTimeout(() => handleVoiceResult(transcript), 100);
    }
  });

  // Auto-start voice recognition when arriving from the big green button
  useEffect(() => {
    if (autoVoice && speech.isSupported && !speech.isListening) {
      // Small delay to let the component mount
      const timer = setTimeout(() => speech.startListening(), 300);
      return () => clearTimeout(timer);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const activeProjects =
    selectedClient?.projects.filter((p) => p.status === "active") ?? [];

  function handleClientChange(clientId: string) {
    setSelectedClientId(clientId);
    setSelectedProjectId("");
  }

  // Returns the effective state after parsing (avoids stale React state)
  async function handleParseText(text: string): Promise<ParsedEntryState | null> {
    if (!text.trim()) return null;
    setIsParsing(true);
    setParseStatus(null);
    setConversationPrompt(null);
    try {
      const parsed = await parseVoiceInput(text);

      // Track what we matched/missed for status display
      const matched: string[] = [];
      const missed: string[] = [];

      // Build the effective state, merging new parse results with current form values (via refs)
      let effectiveHours = hoursRef.current;
      let effectiveClientId = clientIdRef.current;
      let effectiveProjectId = projectIdRef.current;
      let effectiveDescription = descriptionRef.current;

      if (parsed.hours > 0) {
        effectiveHours = String(parsed.hours);
        setHours(effectiveHours);
        matched.push(`${parsed.hours}h`);
      } else if (!effectiveHours) {
        missed.push("hours");
      }

      if (parsed.clientMatch) {
        effectiveClientId = parsed.clientMatch;
        setSelectedClientId(effectiveClientId);
        const client = clients.find((c) => c.id === parsed.clientMatch);
        matched.push(client?.name ?? "client");
        if (parsed.projectMatch) {
          effectiveProjectId = parsed.projectMatch;
          setSelectedProjectId(effectiveProjectId);
          const project = client?.projects.find((p) => p.id === parsed.projectMatch);
          matched.push(project?.name ?? "project");
        } else if (!effectiveProjectId) {
          missed.push("project");
        }
      } else if (!effectiveClientId) {
        missed.push("client");
      }

      if (parsed.description) {
        effectiveDescription = parsed.description;
        setDescription(effectiveDescription);
      }
      if (parsed.mileageKm) {
        setMileageKm(String(parsed.mileageKm));
        matched.push(`${parsed.mileageKm}km`);
      }

      const parts: string[] = [];
      if (matched.length > 0) parts.push(`Matched: ${matched.join(", ")}`);
      if (missed.length > 0) parts.push(`Not found: ${missed.join(", ")}`);
      setParseStatus(parts.join(" · ") || "No matches found — select manually below");

      return {
        hours: effectiveHours,
        clientId: effectiveClientId,
        projectId: effectiveProjectId,
        description: effectiveDescription,
      };
    } catch (err) {
      setParseStatus(`Parse failed: ${err instanceof Error ? err.message : "unknown error"}`);
      return null;
    } finally {
      setIsParsing(false);
    }
  }

  function promptForMissing(state: ParsedEntryState) {
    const missing = getMissingFields(state);
    if (missing.length > 0) {
      setReadyToSave(false);
      setConversationPrompt(getConversationalPrompt(missing));
      // Auto-restart mic for follow-up
      if (speech.isSupported && !speech.isListening) {
        setTimeout(() => speech.startListening(), 500);
      }
    } else {
      setReadyToSave(true);
      setConversationPrompt('Say "save entry" or tap the button below. You can also say "add note" for a description.');
    }
  }

  function triggerSave() {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  }

  async function handleVoiceResult(transcript: string) {
    const cmd = detectVoiceCommand(transcript);

    if (cmd.command === "save-entry") {
      triggerSave();
      return;
    }

    if (cmd.command === "add-note") {
      if (cmd.payload) {
        setDescription((prev) => (prev ? `${prev}. ${cmd.payload}` : cmd.payload));
        setConversationPrompt(`Note added: "${cmd.payload}"`);
      } else {
        setConversationPrompt("Say your note now...");
        if (speech.isSupported) {
          setTimeout(() => speech.startListening(), 500);
        }
      }
      return;
    }

    // Parse and check what's still missing
    const state = await handleParseText(transcript);
    if (state) promptForMissing(state);
  }

  function handleParse() {
    handleParseText(voiceInput).then((state) => {
      if (state) promptForMissing(state);
    });
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
    setConversationPrompt(null);
    setParseStatus(null);
    setReadyToSave(false);
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

        {/* Listening indicator */}
        {speech.isListening && (
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-teal-50 border border-teal-200 px-4 py-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500" />
            </span>
            <span className="text-sm font-medium text-teal-700">Listening... speak now</span>
            <button
              type="button"
              onClick={speech.stopListening}
              className="ml-auto text-teal-600 hover:text-teal-800"
            >
              <MicOff className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex gap-3">
          {speech.isSupported && (
            <button
              type="button"
              onClick={speech.isListening ? speech.stopListening : speech.startListening}
              className={`inline-flex items-center justify-center rounded-lg px-3 py-2.5 transition-colors ${
                speech.isListening
                  ? "bg-red-100 text-red-600 border border-red-300 hover:bg-red-200"
                  : "bg-teal-50 text-teal-600 border border-teal-300 hover:bg-teal-100"
              }`}
              aria-label={speech.isListening ? "Stop listening" : "Start voice input"}
            >
              {speech.isListening ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>
          )}
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
        {speech.error && (
          <p className="mt-2 text-xs text-red-600">{speech.error}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          Tap the mic or use Wispr Flow to dictate. We&apos;ll parse the
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
        {readyToSave && (
          <div className="mt-4">
            <button
              type="button"
              onClick={triggerSave}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-3 rounded-2xl bg-blue-600 px-8 py-5 text-lg font-bold text-white shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Save className="h-6 w-6" />
              )}
              Save Entry
            </button>
            <p className="mt-2 text-center text-xs text-gray-400">
              or say &quot;save entry&quot; · &quot;add note&quot; for a description
            </p>
          </div>
        )}
        {conversationPrompt && !readyToSave && (
          <div className="mt-2 rounded-lg px-4 py-3 text-sm bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-2">
            <Mic className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <span>{conversationPrompt}</span>
          </div>
        )}
      </div>

      <form ref={formRef} action={handleSubmit}>
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
