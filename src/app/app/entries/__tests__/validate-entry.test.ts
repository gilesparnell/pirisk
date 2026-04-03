import { describe, it, expect } from "vitest";
import { validateEntryForm } from "../validate-entry";

describe("validateEntryForm", () => {
  it("returns no errors for valid input", () => {
    const errors = validateEntryForm({
      projectId: "proj-1",
      date: "2026-04-03",
      hours: "4",
      description: "Contract review",
      billable: true,
    });
    expect(errors).toEqual({});
  });

  it("requires a project", () => {
    const errors = validateEntryForm({
      projectId: "",
      date: "2026-04-03",
      hours: "4",
      description: "Work",
      billable: true,
    });
    expect(errors.projectId).toBe("Please select a project");
  });

  it("requires a date", () => {
    const errors = validateEntryForm({
      projectId: "proj-1",
      date: "",
      hours: "4",
      description: "Work",
      billable: true,
    });
    expect(errors.date).toBe("Date is required");
  });

  it("requires positive hours", () => {
    const errors = validateEntryForm({
      projectId: "proj-1",
      date: "2026-04-03",
      hours: "0",
      description: "Work",
      billable: true,
    });
    expect(errors.hours).toBe("Hours must be greater than zero");
  });

  it("rejects hours over 24", () => {
    const errors = validateEntryForm({
      projectId: "proj-1",
      date: "2026-04-03",
      hours: "25",
      description: "Work",
      billable: true,
    });
    expect(errors.hours).toBe("Hours cannot exceed 24");
  });

  it("rejects non-numeric hours", () => {
    const errors = validateEntryForm({
      projectId: "proj-1",
      date: "2026-04-03",
      hours: "abc",
      description: "Work",
      billable: true,
    });
    expect(errors.hours).toBe("Hours must be greater than zero");
  });

  it("accepts decimal hours", () => {
    const errors = validateEntryForm({
      projectId: "proj-1",
      date: "2026-04-03",
      hours: "2.5",
      description: "Work",
      billable: true,
    });
    expect(errors).toEqual({});
  });
});
