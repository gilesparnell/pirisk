import { test, expect } from "@playwright/test";

// ── Auth Helper ─────────────────────────────────────────────

async function devLogin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  // Dev login form is only visible in development
  const devEmail = page.locator('input[name="email"]');
  if (await devEmail.isVisible({ timeout: 3000 })) {
    await devEmail.fill("giles@parnellsystems.com");
    await page.locator("text=Dev Login").click();
    await page.waitForURL("/app**", { timeout: 10000 });
  }
}

// ── Marketing Site ──────────────────────────────────────────

test.describe("Marketing Site", () => {
  test("homepage loads with hero and service cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    // Service cards visible
    await expect(page.getByText("Distressed Project Turnaround")).toBeVisible();
    // Contact section
    await expect(page.locator("#contact")).toBeVisible();
  });

  test("login page shows Google sign-in", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=PiTime")).toBeVisible();
    await expect(page.locator("text=Sign in with Google")).toBeVisible();
  });
});

// ── Authentication ──────────────────────────────────────────

test.describe("Authentication", () => {
  test("unauthenticated users are redirected to login", async ({ page }) => {
    await page.goto("/app");
    await page.waitForURL("**/login**");
    await expect(page.getByRole("button", { name: "Sign in with Google" })).toBeVisible();
  });

  test("dev login grants access to dashboard", async ({ page }) => {
    await devLogin(page);
    await expect(page.locator("h1")).toContainText("Dashboard");
  });
});

// ── Dashboard ───────────────────────────────────────────────

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await devLogin(page);
  });

  test("displays stat cards", async ({ page }) => {
    await expect(page.getByText("Today", { exact: true })).toBeVisible();
    await expect(page.getByText("This Week", { exact: true })).toBeVisible();
    await expect(page.getByText("Unbilled", { exact: true })).toBeVisible();
    await expect(page.getByText("Outstanding", { exact: true })).toBeVisible();
  });

  test("displays quick entry card", async ({ page }) => {
    await expect(page.locator("text=Quick Time Entry")).toBeVisible();
    const newEntryLink = page.locator("a[href='/app/entries?new=1']");
    await expect(newEntryLink).toBeVisible();
  });

  test("displays recent entries section", async ({ page }) => {
    await expect(page.locator("text=Recent Entries")).toBeVisible();
  });
});

// ── Navigation ──────────────────────────────────────────────

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await devLogin(page);
  });

  test("sidebar navigates to all sections", async ({ page }) => {
    // Time Entries
    await page.locator("a[href='/app/entries']").click();
    await page.waitForURL("/app/entries");
    await expect(page.locator("h1")).toContainText("Time Entries");

    // Clients
    await page.locator("a[href='/app/clients']").click();
    await page.waitForURL("/app/clients");
    await expect(page.locator("h1")).toContainText("Clients");

    // Invoices
    await page.locator("a[href='/app/invoices']").click();
    await page.waitForURL("/app/invoices");
    await expect(page.locator("h1")).toContainText("Invoices");

    // Settings
    await page.locator("a[href='/app/settings']").click();
    await page.waitForURL("/app/settings");
    await expect(page.locator("h1")).toContainText("Settings");

    // Back to Dashboard
    await page.locator("a[href='/app']").first().click();
    await page.waitForURL("/app");
    await expect(page.locator("h1")).toContainText("Dashboard");
  });
});

// ── Clients ─────────────────────────────────────────────────

test.describe("Clients", () => {
  test.beforeEach(async ({ page }) => {
    await devLogin(page);
    await page.goto("/app/clients");
  });

  test("page loads with heading and add button", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Clients");
    await expect(page.getByText("Add Client")).toBeVisible();
  });

  test("add client form opens on button click", async ({ page }) => {
    await page.getByText("Add Client").click();
    await expect(page.getByText("New Client")).toBeVisible();
  });
});

// ── Time Entries ────────────────────────────────────────────

test.describe("Time Entries", () => {
  test.beforeEach(async ({ page }) => {
    await devLogin(page);
    await page.goto("/app/entries");
  });

  test("page loads with heading", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Time Entries");
  });

  test("auto-opens form from dashboard link", async ({ page }) => {
    await page.goto("/app/entries?new=1");
    await expect(page.locator("text=Add Time Entry")).toBeVisible();
  });

  test("voice input field accepts text", async ({ page }) => {
    await page.locator("text=New Entry").click();
    const voiceInput = page.locator(
      'input[placeholder*="hours contract review"]'
    );
    await expect(voiceInput).toBeVisible();
    await voiceInput.fill("4 hours contract review");
    await expect(voiceInput).toHaveValue("4 hours contract review");
  });

  test("entry form shows project validation error", async ({ page }) => {
    await page.locator("text=New Entry").click();
    // Fill hours but no project
    const hoursInput = page.locator('input[name="hours"]');
    await hoursInput.fill("4");
    await page.locator("button:has-text('Save Entry')").click();
    // Should show project required error
    await expect(
      page.locator("text=Please select a project")
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── Invoices ────────────────────────────────────────────────

test.describe("Invoices", () => {
  test.beforeEach(async ({ page }) => {
    await devLogin(page);
    await page.goto("/app/invoices");
  });

  test("page loads with heading and create button", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Invoices");
    await expect(page.locator("text=New Invoice")).toBeVisible();
  });

  test("new invoice form appears on button click", async ({ page }) => {
    await page.locator("text=New Invoice").click();
    await expect(page.locator("text=New Invoice").nth(1)).toBeVisible();
    // Client selector visible
    await expect(page.locator("select[name='clientId']")).toBeVisible();
  });
});

// ── Settings ────────────────────────────────────────────────

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await devLogin(page);
    await page.goto("/app/settings");
  });

  test("page loads with business profile form", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Settings");
    await expect(
      page.locator('input[name="businessName"]')
    ).toBeVisible();
  });

  test("bank details section visible", async ({ page }) => {
    await expect(page.locator("text=Bank Details")).toBeVisible();
    await expect(page.locator('input[name="bankName"]')).toBeVisible();
  });
});

// ── Mobile Responsive ───────────────────────────────────────

test.describe("Mobile Responsive", () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone size

  test("marketing homepage renders on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("app shows hamburger menu on mobile", async ({ page }) => {
    await devLogin(page);
    // Sidebar should be hidden, hamburger visible
    const hamburger = page.locator("button[aria-label*='menu'], button[aria-label*='Menu'], button:has(svg.lucide-menu)");
    // On mobile, the sidebar nav links should not be visible by default
    const desktopNav = page.locator("nav a[href='/app/entries']");
    // Either the nav is hidden or a hamburger is present
    const isNavHidden = await desktopNav.isHidden().catch(() => true);
    const hasHamburger = await hamburger.isVisible().catch(() => false);
    expect(isNavHidden || hasHamburger).toBeTruthy();
  });

  test("login page renders on mobile", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=PiTime")).toBeVisible();
    await expect(page.locator("text=Sign in with Google")).toBeVisible();
  });
});
