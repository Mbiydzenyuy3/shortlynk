import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

// Use the same fixed test user from global.setup.ts to avoid extra API calls
const FIXED_USER = {
  email: "e2etestuser@playwright.test",
  password: "PlaywrightTest@1",
};

test.describe("Login Page (/login)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("displays Welcome back heading", async ({ page }) => {
    await expect(page.locator("h1:has-text('Welcome back')")).toBeVisible();
  });

  test("displays subtitle", async ({ page }) => {
    await expect(
      page.locator("text=Sign in to your account")
    ).toBeVisible();
  });

  test("has email and password fields", async ({ page }) => {
    await expect(
      page.locator('input[type="email"][placeholder="you@example.com"]')
    ).toBeVisible();
    await expect(
      page.locator('input[type="password"][placeholder="••••••••"]')
    ).toBeVisible();
  });

  test("has Login submit button", async ({ page }) => {
    await expect(page.locator("button:has-text('Login')")).toBeVisible();
  });

  test("has link to register page", async ({ page }) => {
    await expect(page.locator("a[href='/register']")).toBeVisible();
  });

  test("has Back to home button", async ({ page }) => {
    await expect(page.locator("button:has-text('Back to home')")).toBeVisible();
  });

  test("successful login redirects to /dashboard", async ({ page }) => {
    // Use the fixed test user created (or logged in) during global setup
    await page.locator('input[type="email"]').fill(FIXED_USER.email);
    await page.locator('input[type="password"]').first().fill(FIXED_USER.password);

    await page.locator("button:has-text('Login')").click();

    await page.waitForURL("**/dashboard", { timeout: 10000 });
    expect(page.url()).toContain("/dashboard");

    // Token should be set
    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeTruthy();
  });

  test("shows error message on invalid credentials", async ({ page }) => {
    await page.locator('input[type="email"]').fill("nonexistent@example.com");
    await page
      .locator('input[type="password"]')
      .first()
      .fill("WrongPassword@999");

    await page.locator("button:has-text('Login')").click();

    // Error renders as a <p> inside a div with background color error-tint.
    // The API returns "The password or email is not correct" on bad credentials.
    await expect(
      page.locator("p:has-text('not correct'), p:has-text('Invalid credentials'), p:has-text('invalid'), p:has-text('Please try again')")
    ).toBeVisible({ timeout: 5000 });
  });

  test("Back to home button navigates to /", async ({ page }) => {
    await page.locator("button:has-text('Back to home')").click();
    await expect(page).toHaveURL("/");
  });
});
