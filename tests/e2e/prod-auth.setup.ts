import { test as setup } from "@playwright/test";
import path from "node:path";

const authFile = path.join(__dirname, "../.auth/prod-user.json");

setup("prepare auth state for E2E tests", async ({ page, context }) => {
  const baseURL = process.env.E2E_BASE_URL || "https://dudia-finance-v2-mrl493a7w-dudiafinances-projects.vercel.app";

  await context.addCookies([
    {
      name: "__e2e_authenticated",
      value: "true",
      domain: ".dudia-finance-v2.vercel.app",
      path: "/",
    },
  ]);

  await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  const url = page.url();
  console.log("Dashboard URL:", url);

  await context.storageState({ path: authFile });
  console.log("Auth state saved to:", authFile);
});
