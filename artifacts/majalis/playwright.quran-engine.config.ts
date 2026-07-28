import { defineConfig, devices } from "@playwright/test";

/**
 * Fast, focused Playwright config for Quran Engine suites under `src/tests/e2e`.
 * Desktop Chromium only — keeps CI under a few minutes when run as non-blocking.
 */
export default defineConfig({
  testDir: "./src/tests/e2e",
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:5173",
    trace: "off",
    screenshot: "only-on-failure",
    video: "off",
    locale: "ar-KW",
    timezoneId: "Asia/Kuwait",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command:
      "npx pnpm exec vite --config vite.config.ts --host 127.0.0.1 --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 90_000,
  },
});
