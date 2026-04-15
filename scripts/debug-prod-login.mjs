import { chromium } from "playwright";

const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;

if (!email || !password) {
  throw new Error("Missing TEST_EMAIL or TEST_PASSWORD");
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto("https://dudia-finance-v2.vercel.app/?mode=signin", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);

const emailInput = page.locator('input[name="identifier"], input[type="email"]').first();
const passInput = page.locator('input[name="password"], input[type="password"]').first();
const continueButton = page.getByRole("button", { name: /Continuar|Continue/i }).last();

await emailInput.fill(email);
await passInput.fill(password);
await continueButton.click();
await page.waitForTimeout(5000);

const url = page.url();
const text = await page.locator("body").innerText();
const hasCodeInput = await page.locator('input[name="code"]').isVisible().catch(() => false);
const hasEmailInput = await page.locator('input[name="identifier"], input[type="email"]').isVisible().catch(() => false);
const hasPasswordInput = await page.locator('input[name="password"], input[type="password"]').isVisible().catch(() => false);

console.log("URL", url);
console.log("HAS_CODE_INPUT", hasCodeInput);
console.log("HAS_EMAIL_INPUT", hasEmailInput);
console.log("HAS_PASSWORD_INPUT", hasPasswordInput);
console.log("BODY_SNIPPET", text.slice(0, 1200));

await page.screenshot({ path: "artifacts-debug-login.png", fullPage: true });
await browser.close();
