import { test, expect, type Page } from "@playwright/test";

const stamp = Date.now();
const QA = {
  accountA: `QA_ACC_A_${stamp}`,
  txExpense: `QA_EXP_${stamp}`,
  txIncome: `QA_INC_${stamp}`,
  txInstallment: `QA_PARC_${stamp}`,
  budget: `QA_BUD_${stamp}`,
  goal: `QA_GOAL_${stamp}`,
  tag: `QA_TAG_${stamp}`,
  card: `QA_CARD_${stamp}`,
};

async function waitForApp(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(800);
}

async function closeModal(page: Page) {
  const backdrop = page.locator("[class*='backdrop-blur-sm']").first();
  if (await backdrop.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }
}

async function safeClick(page: Page, selector: string, options?: { timeout?: number }) {
  const timeout = options?.timeout ?? 15000;
  try {
    const element = page.locator(selector).first();
    await element.waitFor({ state: "visible", timeout });
    await element.click({ timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

async function safeFill(page: Page, selector: string, value: string) {
  try {
    const element = page.locator(selector).first();
    await element.waitFor({ state: "visible", timeout: 15000 });
    await element.fill(value, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

test.describe("Production Full Regression", () => {
  test("run end-to-end business flows", async ({ page }) => {
    const failures: string[] = [];

    const step = async (name: string, fn: () => Promise<void>) => {
      try {
        await fn();
      } catch (error) {
        failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    await step("Dashboard loads", async () => {
      await page.goto("/dashboard", { waitUntil: "domcontentloaded", timeout: 30000 });
      await closeModal(page);
      await waitForApp(page);
      await expect(page.getByText("Patrimônio Consolidado")).toBeVisible({ timeout: 15000 });
    });

    await step("Categories seed", async () => {
      await page.goto("/categories", { waitUntil: "domcontentloaded", timeout: 30000 });
      await closeModal(page);
      await waitForApp(page);
      const seedBtn = page.getByRole("button", { name: /Gerar Categorias/i });
      if (await seedBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await seedBtn.click();
        await page.waitForTimeout(1500);
      }
    });

    await step("Create test tag", async () => {
      await page.goto("/tags", { waitUntil: "domcontentloaded", timeout: 30000 });
      await closeModal(page);
      await waitForApp(page);
      await page.getByRole("button", { name: /Nova Etiqueta/i }).click();
      await page.waitForTimeout(600);
      await page.getByPlaceholder("viagem, urgente...").fill(QA.tag);
      await page.getByRole("button", { name: /Criar Etiqueta|Salvar/i }).click();
      await page.waitForTimeout(1000);
    });

    await step("Create account", async () => {
      await page.goto("/accounts", { waitUntil: "domcontentloaded", timeout: 30000 });
      await closeModal(page);
      await waitForApp(page);
      await page.getByRole("button", { name: /Nova Conta/i }).click();
      await page.waitForTimeout(1000);
      await page.getByPlaceholder("Ex: Conta Principal").fill(QA.accountA);
      await page.getByPlaceholder("Ex: Nubank").fill("QA BANK");
      await page.getByRole("button", { name: /Efetivar Nova Conta|Salvar Alterações/i }).click();
      await page.waitForTimeout(1500);
    });

    await step("Create expense transaction", async () => {
      await page.goto("/transactions", { waitUntil: "domcontentloaded", timeout: 30000 });
      await closeModal(page);
      await waitForApp(page);
      await page.getByRole("button", { name: /Novo Lançamento/i }).click();
      await page.waitForTimeout(600);
      await page.locator('input[type="number"]').first().fill("123.45");
      await page.getByPlaceholder("Ex: Assinatura Software").fill(QA.txExpense);
      await page.getByRole("button", { name: /Efetivar Lançamento/i }).click();
      await page.waitForTimeout(1200);
    });

    await step("Create income transaction", async () => {
      await page.goto("/transactions", { waitUntil: "domcontentloaded", timeout: 30000 });
      await closeModal(page);
      await waitForApp(page);
      await page.getByRole("button", { name: /Novo Lançamento/i }).click();
      await page.waitForTimeout(600);
      await page.getByRole("button", { name: /Entrada/i }).last().click();
      await page.waitForTimeout(300);
      await page.locator('input[type="number"]').first().fill("333.33");
      await page.getByPlaceholder("Ex: Assinatura Software").fill(QA.txIncome);
      await page.getByRole("button", { name: /Efetivar Lançamento/i }).click();
      await page.waitForTimeout(1200);
    });

    await step("Create budget", async () => {
      await page.goto("/budgets", { waitUntil: "domcontentloaded", timeout: 30000 });
      await closeModal(page);
      await waitForApp(page);
      await page.getByRole("button", { name: /Novo Orçamento/i }).click();
      await page.waitForTimeout(600);
      await page.getByPlaceholder("Ex: Mercado & Alimentação").fill(QA.budget);
      await page.locator('input[type="number"]').first().fill("900");
      await page.getByRole("button", { name: /Efetivar Orçamento|Salvar Alterações/i }).click();
      await page.waitForTimeout(1200);
    });

    await step("Create goal", async () => {
      await page.goto("/goals", { waitUntil: "domcontentloaded", timeout: 30000 });
      await closeModal(page);
      await waitForApp(page);
      await page.getByRole("button", { name: /Nova Meta/i }).click();
      await page.waitForTimeout(600);
      await page.getByPlaceholder("Ex: Reserva de Emergência").fill(QA.goal);
      await page.locator('input[type="number"]').first().fill("10000");
      await page.getByRole("button", { name: /Criar Nova Meta|Salvar Alterações/i }).click();
      await page.waitForTimeout(1200);
    });

    await step("Create credit card", async () => {
      await page.goto("/credit-cards", { waitUntil: "domcontentloaded", timeout: 30000 });
      await closeModal(page);
      await waitForApp(page);
      await page.getByRole("button", { name: /Novo Cartão/i }).click();
      await page.waitForTimeout(600);
      await page.getByPlaceholder("Ex: Nubank, Inter").fill("QA BANK");
      await page.getByPlaceholder("Ex: Cartão Principal").fill(QA.card);
      await page.getByPlaceholder("1234").fill("7788");
      await page.getByPlaceholder("5000.00").fill("5000");
      await page.getByRole("button", { name: /Salvar Cartão/i }).click();
      await page.waitForTimeout(1500);
    });

    await step("Reports and forecast", async () => {
      await page.goto("/reports", { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(1000);
      await page.goto("/forecast", { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/forecast/, { timeout: 10000 });
    });

    await step("Settings save", async () => {
      await page.goto("/settings", { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(1000);
    });

    if (failures.length > 0) {
      throw new Error(`Production regression failed in ${failures.length} step(s):\n${failures.join("\n")}`);
    }
  });
});
