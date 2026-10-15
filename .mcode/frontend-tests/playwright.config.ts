import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    screenshot: "on",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "authenticated",
      testMatch: /\.auth\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        storageState: "./storage-state.json",
      },
    },
    {
      name: "unauthenticated",
      testMatch: /\.spec\.ts/,
      testIgnore: /\.auth\.spec\.ts/,
    },
  ],
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: `${process.env.MCODE_DIR}/fe_testing/playwright-results.json`,
      },
    ],
  ],
});
