import { describe, it, expect, vi } from "vitest";
import { parseVoiceEntry } from "../voice-parser";

// Mock the Claude API call
vi.mock("../voice-parser", async (importOriginal) => {
  const original = await importOriginal<typeof import("../voice-parser")>();
  return {
    ...original,
    callClaude: vi.fn(),
  };
});

describe("parseVoiceEntry", () => {
  it("parses a simple time entry from text", () => {
    const result = parseVoiceEntry(
      "4 hours contract review for Acme Tower Build today",
      [
        { id: "c1", name: "Acme Corp", projects: [{ id: "p1", name: "Tower Build" }] },
      ]
    );
    expect(result).toBeDefined();
    expect(result.hours).toBe(4);
    expect(result.description).toContain("contract review");
    expect(result.clientMatch).toBe("c1");
    expect(result.projectMatch).toBe("p1");
  });

  it("parses half hours", () => {
    const result = parseVoiceEntry(
      "2 and a half hours site inspection Acme Tower Build",
      [
        { id: "c1", name: "Acme Corp", projects: [{ id: "p1", name: "Tower Build" }] },
      ]
    );
    expect(result.hours).toBe(2.5);
  });

  it("handles no client match gracefully", () => {
    const result = parseVoiceEntry(
      "3 hours admin work",
      [
        { id: "c1", name: "Acme Corp", projects: [{ id: "p1", name: "Tower Build" }] },
      ]
    );
    expect(result.hours).toBe(3);
    expect(result.clientMatch).toBeNull();
    expect(result.projectMatch).toBeNull();
  });

  it("parses mileage from text", () => {
    const result = parseVoiceEntry(
      "half hour travel to site 45 km Acme Tower Build",
      [
        { id: "c1", name: "Acme Corp", projects: [{ id: "p1", name: "Tower Build" }] },
      ]
    );
    expect(result.hours).toBe(0.5);
    expect(result.mileageKm).toBe(45);
  });

  it("handles 'all day' as 8 hours", () => {
    const result = parseVoiceEntry(
      "all day on site Acme Tower Build progress claims",
      [
        { id: "c1", name: "Acme Corp", projects: [{ id: "p1", name: "Tower Build" }] },
      ]
    );
    expect(result.hours).toBe(8);
  });

  it("parses word-form hours like 'four hours'", () => {
    const result = parseVoiceEntry(
      "four hours contract review for Acme Tower Build",
      [
        { id: "c1", name: "Acme Corp", projects: [{ id: "p1", name: "Tower Build" }] },
      ]
    );
    expect(result.hours).toBe(4);
    expect(result.clientMatch).toBe("c1");
  });

  it("parses 'two and a half hours' in word form", () => {
    const result = parseVoiceEntry(
      "two and a half hours site inspection Acme",
      [
        { id: "c1", name: "Acme Corp", projects: [{ id: "p1", name: "Tower Build" }] },
      ]
    );
    expect(result.hours).toBe(2.5);
  });

  it("parses 'one hour' in word form", () => {
    const result = parseVoiceEntry(
      "one hour phone call with Acme",
      [
        { id: "c1", name: "Acme Corp", projects: [{ id: "p1", name: "Tower Build" }] },
      ]
    );
    expect(result.hours).toBe(1);
  });

  it("parses 'three hours' in word form", () => {
    const result = parseVoiceEntry(
      "Add three hours to Tessie Tantrums",
      [
        { id: "c2", name: "Tessie Tantrums", projects: [{ id: "p2", name: "Main Project" }] },
      ]
    );
    expect(result.hours).toBe(3);
    expect(result.clientMatch).toBe("c2");
  });

  // Larger word-form numbers (tens, compounds)
  it("parses 'sixty hours'", () => {
    const result = parseVoiceEntry("Sixty hours Parnell Systems", [
      { id: "c1", name: "ParnellSystems", projects: [] },
    ]);
    expect(result.hours).toBe(60);
  });

  it("parses 'thirty hours'", () => {
    const result = parseVoiceEntry("thirty hours admin", []);
    expect(result.hours).toBe(30);
  });

  it("parses 'forty five hours' (compound)", () => {
    const result = parseVoiceEntry("forty five hours site work", []);
    expect(result.hours).toBe(45);
  });

  it("parses 'twenty one hours' (compound)", () => {
    const result = parseVoiceEntry("twenty one hours report writing", []);
    expect(result.hours).toBe(21);
  });

  it("parses 'a hundred hours'", () => {
    const result = parseVoiceEntry("a hundred hours project management", []);
    expect(result.hours).toBe(100);
  });

  it("parses 'a hundred sixty hours' for a full month", () => {
    const result = parseVoiceEntry("a hundred and sixty hours Parnell Systems", [
      { id: "c1", name: "ParnellSystems", projects: [] },
    ]);
    expect(result.hours).toBe(160);
  });

  it("parses 'eighty hours'", () => {
    const result = parseVoiceEntry("eighty hours contract work", []);
    expect(result.hours).toBe(80);
  });

  it("parses 'three hundred and twenty hours' for multi-month", () => {
    const result = parseVoiceEntry("three hundred and twenty hours total", []);
    expect(result.hours).toBe(320);
  });

  // Fuzzy matching tests
  it("matches client when voice uses a close variant of the name (Tessie → Tess)", () => {
    const result = parseVoiceEntry(
      "4 hours contract review for Tessie Tantrums",
      [
        { id: "c1", name: "Tess Tantrums", projects: [{ id: "p1", name: "Main Project" }] },
      ]
    );
    expect(result.clientMatch).toBe("c1");
  });

  it("matches client when voice truncates the name (Bob → Bobby)", () => {
    const result = parseVoiceEntry(
      "2 hours meeting with Bob Smith",
      [
        { id: "c1", name: "Bobby Smith", projects: [{ id: "p1", name: "Office Fit-out" }] },
      ]
    );
    expect(result.clientMatch).toBe("c1");
  });

  it("matches project with a close variant name", () => {
    const result = parseVoiceEntry(
      "3 hours Acme Towers Build phase 1",
      [
        { id: "c1", name: "Acme Corp", projects: [{ id: "p1", name: "Tower Build Phase 1" }] },
      ]
    );
    expect(result.clientMatch).toBe("c1");
    expect(result.projectMatch).toBe("p1");
  });

  it("matches when voice shortens the name (Tess spoken, Tessie in DB)", () => {
    const result = parseVoiceEntry(
      "4 hours for Tess",
      [
        { id: "c1", name: "Tessie", projects: [{ id: "p1", name: "Main" }] },
      ]
    );
    expect(result.clientMatch).toBe("c1");
  });

  it("matches when voice adds to the name (Tessie spoken, Tess in DB)", () => {
    const result = parseVoiceEntry(
      "4 hours for Tessie",
      [
        { id: "c1", name: "Tess", projects: [{ id: "p1", name: "Main" }] },
      ]
    );
    expect(result.clientMatch).toBe("c1");
  });

  it("does not fuzzy-match very short words to avoid false positives", () => {
    const result = parseVoiceEntry(
      "2 hours admin for IT department",
      [
        { id: "c1", name: "Al Corp", projects: [] },
      ]
    );
    expect(result.clientMatch).toBeNull();
  });

  it("matches case-insensitively with fuzzy matching", () => {
    const result = parseVoiceEntry(
      "4 hours tessie tantrums site visit",
      [
        { id: "c1", name: "Tess Tantrums", projects: [{ id: "p1", name: "Main" }] },
      ]
    );
    expect(result.clientMatch).toBe("c1");
  });

  // CamelCase / PascalCase name splitting
  it("matches PascalCase client name: TessTantrums", () => {
    const result = parseVoiceEntry(
      "Client is Tessie Tantrum, project is Bunny Bashing, 4 hours",
      [
        {
          id: "c1",
          name: "TessTantrums",
          projects: [{ id: "p1", name: "BunnyBashing" }],
        },
      ]
    );
    expect(result.clientMatch).toBe("c1");
    expect(result.projectMatch).toBe("p1");
  });

  it("matches PascalCase with exact words", () => {
    const result = parseVoiceEntry(
      "3 hours ParnellSystems ParnellHelloWorld",
      [
        {
          id: "c1",
          name: "ParnellSystems",
          projects: [{ id: "p1", name: "ParnellHelloWorld" }],
        },
      ]
    );
    expect(result.clientMatch).toBe("c1");
    expect(result.projectMatch).toBe("p1");
  });

  // Punctuation and natural sentence tests
  it("matches client and project from a natural sentence with commas", () => {
    const result = parseVoiceEntry(
      "Client is Tessie Tantrum, project is Bashy Bunnies, hours for 4",
      [
        {
          id: "c1",
          name: "Tess Tantrums",
          projects: [{ id: "p1", name: "Bashy Bunnies" }],
        },
      ]
    );
    expect(result.clientMatch).toBe("c1");
    expect(result.projectMatch).toBe("p1");
  });

  it("matches when words have trailing punctuation", () => {
    const result = parseVoiceEntry(
      "4 hours Acme, Tower Build.",
      [
        { id: "c1", name: "Acme Corp", projects: [{ id: "p1", name: "Tower Build" }] },
      ]
    );
    expect(result.clientMatch).toBe("c1");
    expect(result.projectMatch).toBe("p1");
  });

  // Spelling variation / phonetic tests (Levenshtein)
  it("matches misspelled name: Teasie → Tessie", () => {
    const result = parseVoiceEntry(
      "4 hours for Teasie Tantrums",
      [
        { id: "c1", name: "Tessie Tantrums", projects: [{ id: "p1", name: "Main" }] },
      ]
    );
    expect(result.clientMatch).toBe("c1");
  });

  it("matches misspelled name: Tessy → Tessie", () => {
    const result = parseVoiceEntry(
      "3 hours site visit Tessy Tantrums",
      [
        { id: "c1", name: "Tessie Tantrums", projects: [{ id: "p1", name: "Main" }] },
      ]
    );
    expect(result.clientMatch).toBe("c1");
  });

  it("matches phonetic variation: Akme → Acme", () => {
    const result = parseVoiceEntry(
      "2 hours Akme Tower Build",
      [
        { id: "c1", name: "Acme Corp", projects: [{ id: "p1", name: "Tower Build" }] },
      ]
    );
    expect(result.clientMatch).toBe("c1");
  });

  it("matches transposed letters: Tseise → Tessie", () => {
    const result = parseVoiceEntry(
      "4 hours for Tesise Tantrums",
      [
        { id: "c1", name: "Tessie Tantrums", projects: [{ id: "p1", name: "Main" }] },
      ]
    );
    expect(result.clientMatch).toBe("c1");
  });

  it("does not match wildly different names", () => {
    const result = parseVoiceEntry(
      "4 hours for Margaret Johnson",
      [
        { id: "c1", name: "Tessie Tantrums", projects: [] },
      ]
    );
    expect(result.clientMatch).toBeNull();
  });

  it("matches misspelled project name: Twoer → Tower", () => {
    const result = parseVoiceEntry(
      "3 hours Acme Twoer Build",
      [
        { id: "c1", name: "Acme Corp", projects: [{ id: "p1", name: "Tower Build" }] },
      ]
    );
    expect(result.projectMatch).toBe("p1");
  });
});
