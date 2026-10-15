import { test, expect } from "@playwright/test";

test.describe("Guest URL Shortening (Landing Page /)", () => {
  test("shortens a URL and shows result with localhost:4000/s/ prefix", async ({
    page,
  }) => {
    await page.goto("/");

    const urlInput = page.locator('input[placeholder="Paste your long URL here..."]');
    await urlInput.fill("https://www.example.com/very-long-url-for-testing");

    await page.locator("button:has-text('Shorten')").click();

    // Wait for the result to appear (API response ~300ms)
    await expect(
      page.locator("text=localhost:4000/s/")
    ).toBeVisible({ timeout: 5000 });
  });

  test("shows Sign up free upsell after shortening", async ({ page }) => {
    await page.goto("/");

    const urlInput = page.locator('input[placeholder="Paste your long URL here..."]');
    await urlInput.fill("https://www.github.com/test/repo");

    await page.locator("button:has-text('Shorten')").click();

    await expect(page.locator("text=Sign up free")).toBeVisible({
      timeout: 5000,
    });
  });

  test("shortened result contains a copy button", async ({ page }) => {
    await page.goto("/");

    const urlInput = page.locator('input[placeholder="Paste your long URL here..."]');
    await urlInput.fill("https://www.example.org/another-test-url");

    await page.locator("button:has-text('Shorten')").click();

    // Wait for result
    await expect(page.locator("text=localhost:4000/s/")).toBeVisible({
      timeout: 5000,
    });

    // Copy button has title="Copy" (no aria-label, contains only SVG icon)
    await expect(
      page.locator("button[title='Copy']")
    ).toBeVisible();
  });

  test("Sign up free upsell links to /register", async ({ page }) => {
    await page.goto("/");

    const urlInput = page.locator('input[placeholder="Paste your long URL here..."]');
    await urlInput.fill("https://www.example.com/test-url-registration");

    await page.locator("button:has-text('Shorten')").click();

    await expect(page.locator("text=Sign up free")).toBeVisible({
      timeout: 5000,
    });

    const signupLink = page.locator("a[href='/register']:has-text('Sign up free')");
    await expect(signupLink).toBeVisible();
  });
});
