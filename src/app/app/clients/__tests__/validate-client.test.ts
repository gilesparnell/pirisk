import { describe, it, expect } from "vitest";
import { validateClientForm } from "../validate-client";

describe("validateClientForm", () => {
  it("returns no errors for valid input", () => {
    const errors = validateClientForm({
      name: "Acme Corp",
      rateType: "hourly",
      rate: "275",
    });
    expect(errors).toEqual({});
  });

  it("requires a client name", () => {
    const errors = validateClientForm({
      name: "",
      rateType: "hourly",
      rate: "275",
    });
    expect(errors.name).toBe("Client name is required");
  });

  it("requires a positive rate", () => {
    const errors = validateClientForm({
      name: "Acme",
      rateType: "hourly",
      rate: "0",
    });
    expect(errors.rate).toBe("Rate must be greater than zero");
  });

  it("rejects non-numeric rate", () => {
    const errors = validateClientForm({
      name: "Acme",
      rateType: "hourly",
      rate: "abc",
    });
    expect(errors.rate).toBe("Rate must be a valid number");
  });

  it("rejects negative rate", () => {
    const errors = validateClientForm({
      name: "Acme",
      rateType: "hourly",
      rate: "-50",
    });
    expect(errors.rate).toBe("Rate must be greater than zero");
  });

  it("trims whitespace from name", () => {
    const errors = validateClientForm({
      name: "   ",
      rateType: "hourly",
      rate: "275",
    });
    expect(errors.name).toBe("Client name is required");
  });

  it("accepts daily rate type", () => {
    const errors = validateClientForm({
      name: "BuildCo",
      rateType: "daily",
      rate: "2200",
    });
    expect(errors).toEqual({});
  });
});
