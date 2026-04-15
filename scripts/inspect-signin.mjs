import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto("https://dudia-finance-v2.vercel.app/?mode=signin", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(6000);

const inputs = await page.$$eval("input", (els) =>
  els.map((e) => ({
    name: e.getAttribute("name"),
    type: e.getAttribute("type"),
    placeholder: e.getAttribute("placeholder"),
    id: e.id,
    autocomplete: e.getAttribute("autocomplete"),
    aria: e.getAttribute("aria-label"),
  }))
);

const buttons = await page.$$eval("button", (els) =>
  els.map((e) => e.textContent?.trim()).filter(Boolean)
);

console.log("URL", page.url());
console.log("INPUTS", JSON.stringify(inputs, null, 2));
console.log("BUTTONS", JSON.stringify(buttons, null, 2));

await page.screenshot({ path: "artifacts-signin.png", fullPage: true });
await browser.close();
