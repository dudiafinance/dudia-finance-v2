import { test as setup, expect } from "@playwright/test";
import path from "node:path";

const authFile = path.join(__dirname, "../.auth/prod-user.json");

setup("authenticate production user via test-auth endpoint", async ({ page }) => {
  const email = process.env.TEST_EMAIL;
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!email || !secretKey) {
    throw new Error("Missing TEST_EMAIL or CLERK_SECRET_KEY.");
  }

  const res = await fetch("https://dudia-finance-v2.vercel.app/api/test-auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`test-auth failed (${res.status}): ${err}`);
  }

  const { sessionId } = await res.json();

  await page.goto("/", { waitUntil: "domcontentloaded" });

  await page.context().addCookies([
    {
      name: "__session",
      value: sessionId,
      domain: ".dudia-finance-v2.vercel.app",
      path: "/",
    },
  ]);

  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

  const dashboardLoaded = await page
    .getByText("Patrimônio Consolidado")
    .isVisible({ timeout: 25000 })
    .catch(() => false);

  if (!dashboardLoaded) {
    const url = page.url();
    const bodySnippet = (await page.locator("body").innerText()).slice(0, 500);
    throw new Error(
      `Dashboard did not load. URL: ${url}. Body: ${bodySnippet}`
    );
  }

  await page.context().storageState({ path: authFile });
});