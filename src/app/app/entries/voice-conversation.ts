// Pure logic for conversational voice entry flow.
// Determines what fields are missing and generates prompts.

export type ParsedEntryState = {
  hours: string;
  clientId: string;
  projectId: string;
  description: string;
};

export type MissingField = "client" | "project" | "hours";

export function getMissingFields(state: ParsedEntryState): MissingField[] {
  const missing: MissingField[] = [];
  if (!state.clientId) missing.push("client");
  if (!state.projectId) missing.push("project");
  if (!state.hours || parseFloat(state.hours) === 0) missing.push("hours");
  return missing;
}

export function getConversationalPrompt(missing: MissingField[]): string {
  if (missing.length === 0) {
    return 'All set — ready to save! You can also say "add note" to include a description.';
  }

  const fieldLabels: Record<MissingField, string> = {
    client: "which client",
    project: "which project",
    hours: "how many hours",
  };

  const parts = missing.map((f) => fieldLabels[f]);

  if (parts.length === 1) {
    return `I still need ${parts[0]}. Please say it now.`;
  }

  const last = parts.pop()!;
  return `I still need ${parts.join(", ")} and ${last}. Please say them now.`;
}

export type VoiceCommandResult = {
  command: "add-note" | "save-entry" | null;
  payload: string;
};

const NOTE_PATTERNS = [
  /^add\s+(?:a\s+)?note\s*/i,
  /^add\s+description\s*/i,
  /^note\s*:\s*/i,
];

const SAVE_PATTERNS = [
  /^save\s+entry$/i,
  /^save$/i,
  /^submit$/i,
];

export function detectVoiceCommand(input: string): VoiceCommandResult {
  const trimmed = input.trim();

  for (const pattern of SAVE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { command: "save-entry", payload: "" };
    }
  }

  for (const pattern of NOTE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return {
        command: "add-note",
        payload: trimmed.slice(match[0].length).trim(),
      };
    }
  }

  return { command: null, payload: trimmed };
}
