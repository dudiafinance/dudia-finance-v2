import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  timeout: 180000,
  expect: {
    timeout: 20000,
  },
  use: {
    baseURL: "https://dudia-finance-v2.vercel.app",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /prod-auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/.auth/prod-user.json",
      },
      dependencies: ["setup"],
      testIgnore: /prod-auth\.setup\.ts/,
    },
  ],
});
