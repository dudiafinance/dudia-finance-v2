import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  timeout: 600000,
  expect: {
    timeout: 30000,
  },
  use: {
    baseURL: "https://dudia-finance-v2-mrl493a7w-dudiafinances-projects.vercel.app",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /prod-auth\.setup\.ts/,
      timeout: 300000,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/.auth/prod-user.json",
        extraHTTPHeaders: {
          "x-e2e-bypass": "e2e-test-bypass-token-2024",
        },
      },
      dependencies: ["setup"],
      testIgnore: /prod-auth\.setup\.ts/,
    },
  ],
});
