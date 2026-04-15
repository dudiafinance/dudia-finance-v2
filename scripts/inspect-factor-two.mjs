import { chromium } from "playwright";

const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto("https://dudia-finance-v2.vercel.app/?mode=signin", { waitUntil: "domcontentloaded" });
await page.locator('input[name="identifier"], input[type="email"]').first().fill(email);
await page.locator('input[name="password"], input[type="password"]').first().fill(password);
await page.getByRole("button", { name: /Continuar|Continue/i }).last().click();
await page.waitForTimeout(4000);

console.log("URL_AFTER_SIGNIN", page.url());
console.log("TEXT_SNIPPET", (await page.locator("body").innerText()).slice(0, 900));

const inputsBefore = await page.$$eval("input", els => els.map(e => ({
  name: e.getAttribute("name"),
  type: e.getAttribute("type"),
  id: e.id,
  placeholder: e.getAttribute("placeholder"),
  autocomplete: e.getAttribute("autocomplete"),
  inputmode: e.getAttribute("inputmode"),
  aria: e.getAttribute("aria-label"),
}))); 
console.log("INPUTS_BEFORE", JSON.stringify(inputsBefore, null, 2));

const factorContinue = page.getByRole("button", { name: /Continuar|Continue/i }).last();
if (await factorContinue.isVisible().catch(() => false)) {
  await factorContinue.click();
  await page.waitForTimeout(3000);
}

console.log("URL_AFTER_FACTOR_CONTINUE", page.url());
const inputsAfter = await page.$$eval("input", els => els.map(e => ({
  name: e.getAttribute("name"),
  type: e.getAttribute("type"),
  id: e.id,
  placeholder: e.getAttribute("placeholder"),
  autocomplete: e.getAttribute("autocomplete"),
  inputmode: e.getAttribute("inputmode"),
  aria: e.getAttribute("aria-label"),
}))); 
console.log("INPUTS_AFTER", JSON.stringify(inputsAfter, null, 2));
console.log("TEXT_SNIPPET_AFTER", (await page.locator("body").innerText()).slice(0, 1200));

await page.screenshot({ path: "artifacts-factor-two.png", fullPage: true });
await browser.close();
