import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto("https://dudia-finance-v2.vercel.app/login", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(8000);

const title = await page.title();
const html = await page.content();

const url = page.url();
const inputs = await page.$$eval("input", (els) =>
  els.map((e) => ({
    name: e.getAttribute("name"),
    type: e.getAttribute("type"),
    placeholder: e.getAttribute("placeholder"),
    id: e.id,
    autocomplete: e.getAttribute("autocomplete"),
  }))
);
const buttons = await page.$$eval("button", (els) =>
  els.map((e) => e.textContent?.trim()).filter(Boolean).slice(0, 30)
);
const links = await page.$$eval("a", (els) =>
  els
    .map((e) => ({ text: e.textContent?.trim(), href: e.getAttribute("href") }))
    .filter((x) => x.text)
    .slice(0, 20)
);

console.log("URL", url);
console.log("TITLE", title);
console.log("HTML_LENGTH", html.length);
await page.screenshot({ path: "artifacts-login.png", fullPage: true });
console.log("INPUTS", JSON.stringify(inputs, null, 2));
console.log("BUTTONS", JSON.stringify(buttons, null, 2));
console.log("LINKS", JSON.stringify(links, null, 2));

await browser.close();
