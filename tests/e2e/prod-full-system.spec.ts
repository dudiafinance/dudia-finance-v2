import { test, expect, type Page } from "@playwright/test";

const stamp = Date.now();
const QA = {
  accountA: `QA_ACC_A_${stamp}`,
  accountB: `QA_ACC_B_${stamp}`,
  txExpense: `QA_EXP_${stamp}`,
  txIncome: `QA_INC_${stamp}`,
  txInstallment: `QA_PARC_${stamp}`,
  budget: `QA_BUD_${stamp}`,
  goal: `QA_GOAL_${stamp}`,
  tag: `QA_TAG_${stamp}`,
  card: `QA_CARD_${stamp}`,
};

async function waitForIdle(page: Page, ms = 1200) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(ms);
}

async function clickIfVisible(page: Page, roleName: string) {
  const button = page.getByRole("button", { name: new RegExp(roleName, "i") }).first();
  if (await button.isVisible().catch(() => false)) {
    await button.click();
    return true;
  }
  return false;
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
      await page.goto("/dashboard");
      await waitForIdle(page);
      await expect(page.getByText("Patrimônio Consolidado")).toBeVisible();
    });

    await step("Categories seed and create", async () => {
      await page.goto("/categories");
      await waitForIdle(page);
      if (await clickIfVisible(page, "Gerar Categorias Padrão")) {
        await page.waitForTimeout(1500);
      }
      await page.getByRole("button", { name: /Nova Categoria/i }).click();
      await page.getByPlaceholder("Ex: Supermercado").fill(`QA_CAT_${stamp}`);
      await page.getByRole("button", { name: /Criar Categoria|Salvar Alterações/i }).click();
      await page.waitForTimeout(1200);
    });

    await step("Create test tags", async () => {
      await page.goto("/tags");
      await waitForIdle(page);
      await page.getByRole("button", { name: /Nova Etiqueta/i }).click();
      await page.getByPlaceholder("Ex: Trabalho, Saúde").fill(QA.tag);
      await page.getByRole("button", { name: /Criar Etiqueta|Salvar Alterações/i }).click();
      await page.waitForTimeout(1000);
    });

    await step("Create two accounts", async () => {
      await page.goto("/accounts");
      await waitForIdle(page);

      await page.getByRole("button", { name: /Nova Conta/i }).click();
      await page.getByPlaceholder("Ex: Conta Principal").fill(QA.accountA);
      await page.getByPlaceholder("Ex: Nubank").fill("QA BANK");
      await page.getByRole("button", { name: /Efetivar Nova Conta|Salvar Alterações/i }).click();
      await page.waitForTimeout(1200);

      await page.getByRole("button", { name: /Nova Conta/i }).click();
      await page.getByPlaceholder("Ex: Conta Principal").fill(QA.accountB);
      await page.getByPlaceholder("Ex: Nubank").fill("QA BANK");
      await page.getByRole("button", { name: /Efetivar Nova Conta|Salvar Alterações/i }).click();
      await page.waitForTimeout(1200);
    });

    await step("Transfer between accounts", async () => {
      await page.goto("/accounts");
      await waitForIdle(page);
      await page.getByRole("button", { name: /Transferir/i }).click();
      await page.locator('input[type="number"]').first().fill("50");
      await page.getByRole("button", { name: /Confirmar Transferência|Transferir/i }).last().click();
      await page.waitForTimeout(1200);
    });

    await step("Create expense transaction", async () => {
      await page.goto("/transactions");
      await waitForIdle(page);
      await page.getByRole("button", { name: /Novo Lançamento/i }).click();
      await page.locator('input[type="number"]').first().fill("123.45");
      await page.getByPlaceholder("Ex: Assinatura Software").fill(QA.txExpense);
      await page.getByRole("button", { name: /Efetivar Lançamento/i }).click();
      await page.waitForTimeout(1500);
    });

    await step("Create income transaction", async () => {
      await page.goto("/transactions");
      await waitForIdle(page);
      await page.getByRole("button", { name: /Novo Lançamento/i }).click();
      await clickIfVisible(page, "Receita");
      await page.locator('input[type="number"]').first().fill("333.33");
      await page.getByPlaceholder("Ex: Assinatura Software").fill(QA.txIncome);
      await page.getByRole("button", { name: /Efetivar Lançamento/i }).click();
      await page.waitForTimeout(1500);
    });

    await step("Create installment transaction", async () => {
      await page.goto("/transactions");
      await waitForIdle(page);
      await page.getByRole("button", { name: /Novo Lançamento/i }).click();
      await clickIfVisible(page, "Parcelas");
      await page.locator('input[type="number"]').first().fill("600");
      await page.getByPlaceholder("Ex: Assinatura Software").fill(QA.txInstallment);
      const allNumbers = page.locator('input[type="number"]');
      if ((await allNumbers.count()) > 1) {
        await allNumbers.nth(1).fill("3");
      }
      await page.getByRole("button", { name: /Efetivar Lançamento/i }).click();
      await page.waitForTimeout(1500);
    });

    await step("Create budget", async () => {
      await page.goto("/budgets");
      await waitForIdle(page);
      await page.getByRole("button", { name: /Novo Orçamento/i }).click();
      await page.getByPlaceholder("Ex: Mercado & Alimentação").fill(QA.budget);
      await page.locator('input[type="number"]').first().fill("900");
      await page.getByRole("button", { name: /Efetivar Orçamento|Salvar Alterações/i }).click();
      await page.waitForTimeout(1200);
    });

    await step("Create goal", async () => {
      await page.goto("/goals");
      await waitForIdle(page);
      await page.getByRole("button", { name: /Nova Meta/i }).click();
      await page.getByPlaceholder("Ex: Reserva de Emergência").fill(QA.goal);
      await page.locator('input[type="number"]').first().fill("10000");
      await page.getByRole("button", { name: /Criar Nova Meta|Salvar Alterações/i }).click();
      await page.waitForTimeout(1200);
    });

    await step("Create credit card and launch purchase", async () => {
      await page.goto("/credit-cards");
      await waitForIdle(page);
      await page.getByRole("button", { name: /Novo Cartão/i }).click();
      await page.getByPlaceholder("Ex: Nubank, Inter").fill("QA BANK");
      await page.getByPlaceholder("Ex: Cartão Principal").fill(QA.card);
      await page.getByPlaceholder("1234").fill("7788");
      await page.getByPlaceholder("5000.00").fill("5000");
      await page.getByRole("button", { name: /Salvar Cartão/i }).click();
      await page.waitForTimeout(2000);

      const cardLabel = page.getByText(QA.card).first();
      if (await cardLabel.isVisible({ timeout: 10000 })) {
        await cardLabel.click();
      }
      await clickIfVisible(page, "Lançar Compra");
      await page.getByPlaceholder("0,00").fill("120");
      await page.getByPlaceholder("Ex: Assinatura Software").fill(`QA_CARD_TX_${stamp}`);
      await page.getByRole("button", { name: /Efetivar Lançamento/i }).click();
      await page.waitForTimeout(1500);
    });

    await step("Reports and forecast", async () => {
      await page.goto("/reports");
      await waitForIdle(page);
      await clickIfVisible(page, "Semanal");
      await clickIfVisible(page, "Mensal");
      await clickIfVisible(page, "Anual");
      await clickIfVisible(page, "Exportar CSV");
      await page.goto("/forecast");
      await waitForIdle(page);
      await expect(page.getByText(/Previsão 12 Meses/i)).toBeVisible();
    });

    await step("Settings save", async () => {
      await page.goto("/settings");
      await waitForIdle(page);
      await clickIfVisible(page, "Salvar Parâmetros");
      await page.waitForTimeout(1000);
    });

    if (failures.length > 0) {
      throw new Error(`Production regression failed in ${failures.length} step(s):\n${failures.join("\n")}`);
    }
  });
});
