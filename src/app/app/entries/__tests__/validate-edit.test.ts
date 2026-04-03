import { describe, it, expect } from "vitest";
import { validateEditForm, type EditFormData } from "../validate-entry";

describe("validateEditForm", () => {
  const valid: EditFormData = {
    hours: "4",
    description: "Contract review",
    billable: true,
    mileageKm: "",
  };

  it("returns no errors for valid edit data", () => {
    expect(validateEditForm(valid)).toEqual({});
  });

  it("rejects zero hours", () => {
    const errors = validateEditForm({ ...valid, hours: "0" });
    expect(errors.hours).toBeDefined();
  });

  it("rejects negative hours", () => {
    const errors = validateEditForm({ ...valid, hours: "-1" });
    expect(errors.hours).toBeDefined();
  });

  it("rejects hours > 24", () => {
    const errors = validateEditForm({ ...valid, hours: "25" });
    expect(errors.hours).toBeDefined();
  });

  it("accepts valid hours", () => {
    const errors = validateEditForm({ ...valid, hours: "7.5" });
    expect(errors.hours).toBeUndefined();
  });

  it("rejects non-numeric hours", () => {
    const errors = validateEditForm({ ...valid, hours: "abc" });
    expect(errors.hours).toBeDefined();
  });
});
