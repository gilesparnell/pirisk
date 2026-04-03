import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import HomePage from "../page";

describe("HomePage", () => {
  // Hero section
  it("renders the hero headline", () => {
    render(<HomePage />);
    expect(
      screen.getByText(/Turn Construction Chaos/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Commercial Excellence/i).length
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders hero subtitle with value proposition", () => {
    render(<HomePage />);
    expect(
      screen.getByText(/Expert commercial consulting/i)
    ).toBeInTheDocument();
  });

  it("renders hero CTA buttons", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("link", { name: /Start the Conversation/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Our Services/i })
    ).toBeInTheDocument();
  });

  // Services section
  it("renders all 6 service cards", () => {
    render(<HomePage />);
    const serviceNames = [
      "Distressed Project Turnaround",
      "Contract Management",
      "Developer Services",
      "Strata & Defects",
      "Operational Excellence",
      "Project Intervention",
    ];
    for (const name of serviceNames) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it("renders services section header", () => {
    render(<HomePage />);
    expect(screen.getByText("What We Do")).toBeInTheDocument();
  });

  // About section
  it("renders about section with stats", () => {
    render(<HomePage />);
    expect(screen.getByText("20+")).toBeInTheDocument();
    expect(screen.getByText("Years Experience")).toBeInTheDocument();
    expect(screen.getByText("$67M+")).toBeInTheDocument();
    expect(screen.getByText("AUD Value Recovered")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("Client Focused")).toBeInTheDocument();
  });

  // Contact section
  it("renders contact section with phone and email", () => {
    render(<HomePage />);
    expect(screen.getByText("Let's Talk")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /\+61 401 805 618/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /allerick@pirisk.com.au/i })
    ).toBeInTheDocument();
  });

  it("renders contact form with required fields", () => {
    render(<HomePage />);
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Send Message/i })
    ).toBeInTheDocument();
  });

  it("renders Grace AI chat button", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("button", { name: /Chat with Grace/i })
    ).toBeInTheDocument();
  });

  // Footer
  it("renders footer with brand and copyright", () => {
    render(<HomePage />);
    expect(
      screen.getByText(/Construction Commercial Consulting/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/PiRisk Management. All rights reserved/i)
    ).toBeInTheDocument();
  });
});
