import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto("https://dudia-finance-v2.vercel.app/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);

const links = await page.$$eval("a", (els) =>
  els
    .map((e) => ({ text: e.textContent?.trim(), href: e.getAttribute("href") }))
    .filter((x) => x.href)
);

const buttons = await page.$$eval("button", (els) =>
  els.map((e) => e.textContent?.trim()).filter(Boolean)
);

console.log("URL", page.url());
console.log("LINKS", JSON.stringify(links, null, 2));
console.log("BUTTONS", JSON.stringify(buttons, null, 2));

await page.screenshot({ path: "artifacts-home.png", fullPage: true });
await browser.close();
