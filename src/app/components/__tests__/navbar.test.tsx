import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Navbar } from "../navbar";

describe("Navbar", () => {
  it("renders logo image", () => {
    render(<Navbar />);
    expect(
      screen.getByAltText("PiRisk Management")
    ).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(<Navbar />);
    expect(
      screen.getByRole("link", { name: /Services/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /About/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Get In Touch/i })
    ).toBeInTheDocument();
  });

  it("renders PiTime link for authenticated users", () => {
    render(<Navbar />);
    expect(
      screen.getByRole("link", { name: /PiTime/i })
    ).toBeInTheDocument();
  });

  it("renders mobile menu button", () => {
    render(<Navbar />);
    expect(
      screen.getByRole("button", { name: /Toggle menu/i })
    ).toBeInTheDocument();
  });
});
