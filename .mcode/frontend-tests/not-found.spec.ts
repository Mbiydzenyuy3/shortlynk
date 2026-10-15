import { test, expect } from "@playwright/test";

test.describe("404 Not Found Page", () => {
  test("shows 404 heading on unknown route", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.locator("h1:has-text('404')")).toBeVisible();
  });

  test("shows 'Page not found' text", async ({ page }) => {
    await page.goto("/some/random/route/that/does/not/exist");
    await expect(page.locator("h2:has-text('Page not found')")).toBeVisible();
  });

  test("shows descriptive message about the missing page", async ({ page }) => {
    await page.goto("/nonexistent-route");
    await expect(
      page.locator(
        "text=The page you're looking for doesn't exist or has been moved."
      )
    ).toBeVisible();
  });

  test("shows 'Back to home' link that navigates to /", async ({ page }) => {
    await page.goto("/this-route-is-not-defined");
    // notFound renders <Link to="/" className="btn btn--primary">Back to home</Link>
    // which renders as <a href="/">Back to home</a>
    const backLink = page.locator("a[href='/']:has-text('Back to home')");
    await expect(backLink).toBeVisible();

    await backLink.click();
    await expect(page).toHaveURL("/");
  });
});
