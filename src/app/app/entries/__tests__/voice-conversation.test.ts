import { describe, it, expect } from "vitest";
import {
  getMissingFields,
  getConversationalPrompt,
  detectVoiceCommand,
  type ParsedEntryState,
} from "../voice-conversation";

describe("getMissingFields", () => {
  it("returns all fields when nothing is set", () => {
    const state: ParsedEntryState = {
      hours: "",
      clientId: "",
      projectId: "",
      description: "",
    };
    const missing = getMissingFields(state);
    expect(missing).toEqual(["client", "project", "hours"]);
  });

  it("returns empty array when all required fields are set", () => {
    const state: ParsedEntryState = {
      hours: "4",
      clientId: "abc",
      projectId: "xyz",
      description: "",
    };
    const missing = getMissingFields(state);
    expect(missing).toEqual([]);
  });

  it("returns only missing fields", () => {
    const state: ParsedEntryState = {
      hours: "4",
      clientId: "abc",
      projectId: "",
      description: "",
    };
    const missing = getMissingFields(state);
    expect(missing).toEqual(["project"]);
  });

  it("treats zero hours as missing", () => {
    const state: ParsedEntryState = {
      hours: "0",
      clientId: "abc",
      projectId: "xyz",
      description: "",
    };
    const missing = getMissingFields(state);
    expect(missing).toEqual(["hours"]);
  });
});

describe("getConversationalPrompt", () => {
  it("returns prompt for all missing fields", () => {
    const prompt = getConversationalPrompt(["client", "project", "hours"]);
    expect(prompt).toContain("client");
    expect(prompt).toContain("project");
    expect(prompt).toContain("hours");
  });

  it("returns prompt for single missing field", () => {
    const prompt = getConversationalPrompt(["hours"]);
    expect(prompt).toContain("hours");
    expect(prompt).not.toContain("client");
  });

  it("returns success message when nothing is missing", () => {
    const prompt = getConversationalPrompt([]);
    expect(prompt).toContain("ready");
  });

  it("returns prompt for two missing fields", () => {
    const prompt = getConversationalPrompt(["client", "hours"]);
    expect(prompt).toContain("client");
    expect(prompt).toContain("hours");
  });
});

describe("detectVoiceCommand", () => {
  it("detects 'add note' command", () => {
    const result = detectVoiceCommand("add note this was a long meeting");
    expect(result.command).toBe("add-note");
    expect(result.payload).toBe("this was a long meeting");
  });

  it("detects 'add a note' command", () => {
    const result = detectVoiceCommand("add a note reviewed contracts");
    expect(result.command).toBe("add-note");
    expect(result.payload).toBe("reviewed contracts");
  });

  it("detects 'note' at start of input", () => {
    const result = detectVoiceCommand("note: discussed scope changes");
    expect(result.command).toBe("add-note");
    expect(result.payload).toBe("discussed scope changes");
  });

  it("returns no command for regular input", () => {
    const result = detectVoiceCommand("4 hours contract review for Acme");
    expect(result.command).toBeNull();
    expect(result.payload).toBe("4 hours contract review for Acme");
  });

  it("handles case-insensitive commands", () => {
    const result = detectVoiceCommand("Add Note fixed the pipeline");
    expect(result.command).toBe("add-note");
    expect(result.payload).toBe("fixed the pipeline");
  });

  it("handles 'add description' as alias", () => {
    const result = detectVoiceCommand("add description quarterly review prep");
    expect(result.command).toBe("add-note");
    expect(result.payload).toBe("quarterly review prep");
  });

  it("returns empty payload when note command has no text", () => {
    const result = detectVoiceCommand("add note");
    expect(result.command).toBe("add-note");
    expect(result.payload).toBe("");
  });

  it("detects 'save entry' command", () => {
    const result = detectVoiceCommand("save entry");
    expect(result.command).toBe("save-entry");
    expect(result.payload).toBe("");
  });

  it("detects 'save entry' case-insensitive", () => {
    const result = detectVoiceCommand("Save Entry");
    expect(result.command).toBe("save-entry");
    expect(result.payload).toBe("");
  });

  it("detects 'save' alone as save command", () => {
    const result = detectVoiceCommand("save");
    expect(result.command).toBe("save-entry");
    expect(result.payload).toBe("");
  });

  it("detects 'submit' as save command", () => {
    const result = detectVoiceCommand("submit");
    expect(result.command).toBe("save-entry");
    expect(result.payload).toBe("");
  });

  it("does not match 'save' when part of a longer phrase", () => {
    const result = detectVoiceCommand("save the document for later");
    expect(result.command).toBeNull();
  });
});
