import { test as setup, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const STORAGE_STATE = path.join(__dirname, "storage-state.json");
const CREDS_FILE = path.join(__dirname, ".test-credentials.json");

// Fixed test user — reused across all runs to avoid rate-limit issues.
const TEST_USER = {
  username: "e2etestuser",
  email: "e2etestuser@playwright.test",
  password: "PlaywrightTest@1",
};

async function tryRegister(request: Parameters<typeof setup>[1]["request"]): Promise<string | null> {
  try {
    const res = await request.post("http://localhost:4000/api/oauth/register", {
      data: TEST_USER,
    });
    const text = await res.text();
    let body: Record<string, unknown> = {};
    try { body = JSON.parse(text); } catch { return null; }
    if (body.success && body.token) return body.token as string;
    return null;
  } catch {
    return null;
  }
}

async function tryLogin(request: Parameters<typeof setup>[1]["request"]): Promise<string | null> {
  try {
    const res = await request.post("http://localhost:4000/api/oauth/login", {
      data: { email: TEST_USER.email, password: TEST_USER.password },
    });
    const text = await res.text();
    let body: Record<string, unknown> = {};
    try { body = JSON.parse(text); } catch { return null; }
    if (body.success && body.token) return body.token as string;
    return null;
  } catch {
    return null;
  }
}

setup("create/login test user and save auth state", async ({ page, request }) => {
  // Strategy: try to register first (creates user on first run),
  // fall back to login (user already exists from a previous run).
  let token: string | null = null;

  // Attempt 1: try to register
  token = await tryRegister(request);

  // Attempt 2: if registration failed (user exists or rate-limited), try login
  if (!token) {
    token = await tryLogin(request);
  }

  // Attempt 3: if login failed, wait 5s for rate-limit window and retry
  if (!token) {
    await new Promise((r) => setTimeout(r, 5000));
    token = await tryRegister(request);
    if (!token) token = await tryLogin(request);
  }

  expect(token, "Could not register or login the test user after retries").toBeTruthy();

  // Navigate to the app and set the token in localStorage
  await page.goto("http://localhost:5173/");
  await page.evaluate((t: string) => {
    localStorage.setItem("token", t);
  }, token as string);

  // Save the storage state so authenticated tests can reuse it
  await page.context().storageState({ path: STORAGE_STATE });

  // Write credentials file for tests that need raw values
  fs.writeFileSync(CREDS_FILE, JSON.stringify(TEST_USER, null, 2));
});
