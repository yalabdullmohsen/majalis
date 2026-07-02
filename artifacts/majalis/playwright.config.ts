import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false, // sequential — one dev server
  retries: 1,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    locale: "ar-KW",
    timezoneId: "Asia/Kuwait",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 5"],
        browserName: "chromium",
        isMobile: true,
      },
    },
  ],
  webServer: {
    command: "npx pnpm exec vite --config vite.config.ts --host 0.0.0.0 --port 5173",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
