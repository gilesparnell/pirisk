import { describe, it, expect, vi, beforeEach } from "vitest";

// We'll test the pure logic extracted from the hook
// The hook itself wraps browser APIs, but we test the state machine logic
import {
  createSpeechState,
  handleSpeechResult,
  handleSpeechError,
} from "../speech-recognition";

describe("createSpeechState", () => {
  it("returns idle state with empty transcript", () => {
    const state = createSpeechState();
    expect(state.isListening).toBe(false);
    expect(state.transcript).toBe("");
    expect(state.error).toBeNull();
  });
});

describe("handleSpeechResult", () => {
  it("returns transcript from final result", () => {
    const result = handleSpeechResult("4 hours contract review for Acme");
    expect(result.transcript).toBe("4 hours contract review for Acme");
    expect(result.isFinal).toBe(true);
  });

  it("trims whitespace from transcript", () => {
    const result = handleSpeechResult("  hello world  ");
    expect(result.transcript).toBe("hello world");
  });

  it("handles empty string", () => {
    const result = handleSpeechResult("");
    expect(result.transcript).toBe("");
    expect(result.isFinal).toBe(true);
  });
});

describe("handleSpeechError", () => {
  it("returns user-friendly message for not-allowed error", () => {
    const error = handleSpeechError("not-allowed");
    expect(error).toBe("Microphone access denied. Please allow microphone access in your browser settings.");
  });

  it("returns user-friendly message for no-speech error", () => {
    const error = handleSpeechError("no-speech");
    expect(error).toBe("No speech detected. Please try again.");
  });

  it("returns user-friendly message for network error", () => {
    const error = handleSpeechError("network");
    expect(error).toBe("Network error. Please check your connection.");
  });

  it("returns generic message for unknown errors", () => {
    const error = handleSpeechError("something-weird");
    expect(error).toBe("Speech recognition error. Please try again.");
  });

  it("returns user-friendly message for aborted", () => {
    const error = handleSpeechError("aborted");
    expect(error).toBe("Speech recognition was stopped.");
  });
});
