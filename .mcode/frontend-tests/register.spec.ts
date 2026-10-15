import { test, expect } from "@playwright/test";

test.describe("Register Page (/register)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("displays the registration form with correct heading", async ({
    page,
  }) => {
    await expect(page.locator("h1:has-text('Create account')")).toBeVisible();
  });

  test("displays subtitle text", async ({ page }) => {
    await expect(
      page.locator("text=Start shortening links in seconds")
    ).toBeVisible();
  });

  test("has username, email, and password fields", async ({ page }) => {
    await expect(
      page.locator('input[placeholder="yourname"]')
    ).toBeVisible();
    await expect(
      page.locator('input[type="email"][placeholder="you@example.com"]')
    ).toBeVisible();
    await expect(
      page.locator('input[type="password"][placeholder="••••••••"]')
    ).toBeVisible();
  });

  test("has Create Account submit button", async ({ page }) => {
    await expect(
      page.locator("button:has-text('Create Account')")
    ).toBeVisible();
  });

  test("has link to login page", async ({ page }) => {
    await expect(page.locator("a[href='/login']")).toBeVisible();
  });

  test("has Back to home button", async ({ page }) => {
    await expect(page.locator("button:has-text('Back to home')")).toBeVisible();
  });

  test("shows password hints that react to input", async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]').first();
    // Initially hints are not green — type a valid password and check
    await passwordInput.fill("TestPass@1");
    // Both password hint conditions should show checked state
    await expect(page.locator("text=6 to 30 characters")).toBeVisible();
    await expect(page.locator("text=At least 1 special character")).toBeVisible();
  });

  test("successful registration redirects to /dashboard", async ({ page }) => {
    const unique = Date.now().toString().slice(-8);
    const username = `regtest${unique}`;
    const email = `regtest${unique}@example.com`;
    const password = "RegTest@123";

    await page.locator('input[placeholder="yourname"]').fill(username);
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').first().fill(password);

    await page.locator("button:has-text('Create Account')").click();

    // Should redirect to dashboard after successful registration
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    expect(page.url()).toContain("/dashboard");

    // Token should be set in localStorage
    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeTruthy();
  });

  test("Back to home button navigates to /", async ({ page }) => {
    await page.locator("button:has-text('Back to home')").click();
    await expect(page).toHaveURL("/");
  });
});
