import dotenv from "dotenv";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, ".env.local") });
dotenv.config({ path: path.resolve(__dirname, ".env.production"), override: true });

const env = {
  ...process.env,
  TEST_EMAIL: process.env.TEST_EMAIL || "igorpminacio1@gmail.com",
};

const result = execSync(
  `npx playwright test --config=playwright.prod.config.ts tests/e2e/prod-full-system.spec.ts`,
  {
    env,
    stdio: "inherit",
    encoding: "utf8",
  }
);

console.log(result);