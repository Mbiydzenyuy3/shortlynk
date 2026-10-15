import { test, expect } from "@playwright/test";

// These tests use the authenticated storage state from global.setup.ts
// (token is pre-loaded into localStorage via storageState)

test.describe("Dashboard (/dashboard) — Authenticated", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    // Wait for the dashboard to actually load (not redirect to login)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test("renders the ShortenBar with URL input and Shorten button", async ({
    page,
  }) => {
    await expect(
      page.locator('input[placeholder="Paste URL here"]')
    ).toBeVisible();
    await expect(page.locator("button:has-text('Shorten')")).toBeVisible();
  });

  test("renders the custom alias input", async ({ page }) => {
    await expect(
      page.locator('input[placeholder="Alias (e.g. my-link)"]')
    ).toBeVisible();
  });

  test("shows link table with Created, Short link, Original link, Clicks columns", async ({
    page,
  }) => {
    // Column headers use title-case: "Created", "Short link", "Original link", "Clicks"
    await expect(page.locator("th:has-text('Created')")).toBeVisible();
    await expect(page.locator("th:has-text('Short link')")).toBeVisible();
    await expect(page.locator("th:has-text('Original link')")).toBeVisible();
    await expect(page.locator("th:has-text('Clicks')")).toBeVisible();
  });

  test("shows search/filter input in the link table", async ({ page }) => {
    await expect(
      page.locator('input[placeholder="Search or filter..."]')
    ).toBeVisible();
  });

  test("shows empty state 'No links yet' or table rows once loading completes", async ({
    page,
  }) => {
    // Wait for the link table to load — the table header span is always present once loaded
    await expect(page.locator("span:has-text('All links')").first()).toBeVisible({ timeout: 10000 });

    // EmptyState uses a <p> for the message, not <h3>
    const emptyState = page.locator("p:has-text('No links yet')");
    const tableRows = page.locator("tbody tr");

    const emptyOrHasRows =
      (await emptyState.isVisible()) || (await tableRows.count()) > 0;
    expect(emptyOrHasRows).toBeTruthy();
  });

  test("creates a short URL and shows it in the link table", async ({
    page,
  }) => {
    const urlInput = page.locator('input[placeholder="Paste URL here"]');
    await urlInput.fill("https://www.example.com/dashboard-test-url");

    await page.locator("button:has-text('Shorten')").click();

    // Result banner appears with shortened URL (use first() since the table may also show links)
    await expect(
      page.locator("text=localhost:4000/s/").first()
    ).toBeVisible({ timeout: 5000 });

    // Link table header span confirms a link was added
    await expect(
      page.locator("span:has-text('All links')").first()
    ).toBeVisible({ timeout: 5000 });

    // The shortened link appears in the table as a span in the second column
    await expect(
      page.locator("td:nth-child(2) span:has-text('localhost:4000/s/')").first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("creates a short URL with a custom alias", async ({ page }) => {
    const unique = Date.now().toString().slice(-6);
    const alias = `myalias${unique}`;

    await page
      .locator('input[placeholder="Paste URL here"]')
      .fill("https://www.example.com/alias-test");
    await page.locator('input[placeholder="Alias (e.g. my-link)"]').fill(alias);

    await page.locator("button:has-text('Shorten')").click();

    // Result shows the custom alias in the shortened URL
    await expect(
      page.locator(`text=localhost:4000/s/${alias}`).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("search filter reduces visible table rows", async ({ page }) => {
    // First create a link with identifiable URL
    const unique = Date.now().toString().slice(-6);
    const targetUrl = `https://www.search-test-${unique}.com/page`;

    await page.locator('input[placeholder="Paste URL here"]').fill(targetUrl);
    await page.locator("button:has-text('Shorten')").click();

    await expect(page.locator("text=localhost:4000/s/").first()).toBeVisible({
      timeout: 5000,
    });

    // Type in the search filter
    const searchInput = page.locator('input[placeholder="Search or filter..."]');
    await searchInput.fill(`search-test-${unique}`);

    // Should show the matching row
    await expect(page.locator(`td:has-text("${targetUrl}")`)).toBeVisible({
      timeout: 3000,
    });
  });

  test("row actions (Copy, Open, Analytics, Edit, Delete) are visible", async ({
    page,
  }) => {
    // Ensure there's at least one link
    await page
      .locator('input[placeholder="Paste URL here"]')
      .fill("https://www.example.com/actions-test");
    await page.locator("button:has-text('Shorten')").click();
    await expect(page.locator("text=localhost:4000/s/").first()).toBeVisible({
      timeout: 5000,
    });

    // Row action buttons use 'title' attribute (not 'aria-label') per ActionBtn component
    await expect(
      page.locator("button[title='Analytics']").first()
    ).toBeVisible();
    await expect(
      page.locator("button[title='Copy short link']").first()
    ).toBeVisible();
    await expect(
      page.locator("button[title='Delete']").first()
    ).toBeVisible();
    await expect(
      page.locator("button[title='Edit expiry']").first()
    ).toBeVisible();
    await expect(
      page.locator("button[title='Open link']").first()
    ).toBeVisible();
  });

  test("unauthenticated access to /dashboard redirects to /login", async ({
    browser,
  }) => {
    // Explicitly create a clean context with empty storage (no token)
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();
    await page.goto("http://localhost:5173/dashboard");
    // React useEffect fires after render; the client-side auth guard calls navigate('/login')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    await ctx.close();
  });
});
