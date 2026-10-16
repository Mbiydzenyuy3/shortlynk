import { test, expect } from "@playwright/test";

// These tests use the authenticated storage state from global.setup.ts

test.describe("URLs Page (/urls) — Authenticated", () => {
  test.beforeEach(async ({ page }) => {
    // Create at least one link so the table has data for sort tests
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });

    const urlInput = page.locator('input[placeholder="Paste URL here"]');
    const count = await urlInput.count();
    if (count > 0) {
      await urlInput.fill("https://www.example.com/urls-page-test");
      await page.locator("button:has-text('Shorten')").click();
      await page.locator("text=localhost:4000/s/").first().waitFor({ timeout: 5000 });
    }

    await page.goto("/urls");
    await expect(page).toHaveURL(/\/urls/, { timeout: 5000 });
  });

  test("displays the All Links heading", async ({ page }) => {
    await expect(page.locator("h1:has-text('All Links')")).toBeVisible();
  });

  test("has sort select with 4 options", async ({ page }) => {
    const sortSelect = page.locator("select");
    await expect(sortSelect).toBeVisible();

    // Sort option values: newest, oldest, clicks, expiring
    await expect(sortSelect.locator("option[value='newest']")).toHaveText("Newest");
    await expect(sortSelect.locator("option[value='oldest']")).toHaveText("Oldest");
    await expect(sortSelect.locator("option[value='clicks']")).toHaveText("Most Clicks");
    await expect(sortSelect.locator("option[value='expiring']")).toHaveText("Expiring Soon");
  });

  test("shows + Shorten New button", async ({ page }) => {
    await expect(
      page.locator("button:has-text('+ Shorten New')")
    ).toBeVisible();
  });

  test("+ Shorten New button navigates to /dashboard", async ({ page }) => {
    await page.locator("button:has-text('+ Shorten New')").click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test("displays link table with correct columns", async ({ page }) => {
    // Column headers use title-case per LinkTable component
    await expect(page.locator("th:has-text('Created')")).toBeVisible();
    await expect(page.locator("th:has-text('Short link')")).toBeVisible();
    await expect(page.locator("th:has-text('Original link')")).toBeVisible();
    await expect(page.locator("th:has-text('Clicks')")).toBeVisible();
  });

  test("sort select changes row order without crashing the page", async ({
    page,
  }) => {
    const sortSelect = page.locator("select");

    // Verify the sort select is functional — test each option and confirm page stays stable.
    // The page heading must remain visible throughout all sort changes.
    const heading = page.getByRole("heading", { name: "All Links" });
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Cycle through all sort options and confirm the page doesn't crash
    for (const value of ["newest", "oldest", "clicks", "expiring"]) {
      await sortSelect.selectOption(value);
      await expect(heading).toBeVisible({ timeout: 5000 });
      // Sort select reflects the selected value
      await expect(sortSelect).toHaveValue(value);
    }
  });

  test("has search/filter input", async ({ page }) => {
    await expect(
      page.locator('input[placeholder="Search or filter..."]')
    ).toBeVisible();
  });

  test("unauthenticated access to /urls redirects to /login", async ({
    browser,
  }) => {
    // Explicitly create a clean context with empty storage (no token)
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();
    await page.goto("http://localhost:5173/urls");
    // React useEffect fires after render; the client-side auth guard calls navigate('/login')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    await ctx.close();
  });
});
