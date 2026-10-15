import { test, expect } from "@playwright/test";

test.describe("Landing Page (/)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("displays the main hero heading", async ({ page }) => {
    await expect(
      page.locator("h1:has-text('Short links that tell you who clicked')")
    ).toBeVisible();
  });

  test("displays the navbar with Shortlynk branding", async ({ page }) => {
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator("nav")).toContainText("Shortlynk");
  });

  test("shows Login and Get Started buttons in navbar (unauthenticated)", async ({
    page,
  }) => {
    await expect(page.getByRole("button", { name: "Login", exact: true })).toBeVisible();
    // Use exact match to avoid matching "Get Started Free" in the CTA section
    await expect(page.getByRole("button", { name: "Get Started", exact: true })).toBeVisible();
  });

  test("displays the URL input and Shorten button in hero section", async ({
    page,
  }) => {
    await expect(
      page.locator('input[placeholder="Paste your long URL here..."]')
    ).toBeVisible();
    await expect(page.locator("button:has-text('Shorten')")).toBeVisible();
  });

  test("shows 'No account needed to try it' text below the input", async ({
    page,
  }) => {
    await expect(page.locator("text=No account needed to try it")).toBeVisible();
  });

  test("displays the features section with three feature cards", async ({
    page,
  }) => {
    await expect(
      page.locator("text=Everything you need to share smarter")
    ).toBeVisible();
    await expect(page.locator("text=Custom Short Links")).toBeVisible();
    // Scope to h3 to avoid matching "click analytics" in footer text
    await expect(page.locator("h3:has-text('Click Analytics')")).toBeVisible();
    await expect(page.locator("text=Secure & Reliable")).toBeVisible();
  });

  test("displays the how-it-works section with 3 numbered steps", async ({
    page,
  }) => {
    await expect(
      page.locator("text=Up and running in seconds")
    ).toBeVisible();
    await expect(page.locator("text=Paste your URL")).toBeVisible();
    await expect(page.locator("text=Click Shorten")).toBeVisible();
    await expect(page.locator("text=Share & Track")).toBeVisible();
  });

  test("displays the CTA banner with Get Started Free button", async ({
    page,
  }) => {
    await expect(
      page.locator("text=Start shortening for free")
    ).toBeVisible();
    await expect(
      page.locator("button:has-text('Get Started Free')")
    ).toBeVisible();
  });

  test("CTA Get Started Free button links to /register", async ({ page }) => {
    const ctaLink = page.locator("a[href='/register']:has(button:has-text('Get Started Free'))");
    await expect(ctaLink).toBeVisible();
  });

  test("displays footer with Shortlynk branding and copyright", async ({
    page,
  }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("Shortlynk");
    await expect(footer).toContainText("© 2026 Shortlynk");
  });
});
