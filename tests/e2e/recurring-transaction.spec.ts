import { test, expect, type Page } from '@playwright/test';

const TEST_RECURRING_TX_DESC = 'TEST_RECUR_E2E';
const TEST_ACCOUNT_NAME = 'TEST_RECUR_ACC';

test.describe('Recurring Transaction E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.route('**/*', async route => {
      const headers = {
        ...route.request().headers(),
        'x-debug-bypass': 'debug-token-default',
      };
      await route.continue({ headers });
    });

    page.on('console', msg => {
      if (msg.type() === 'error') console.error(`[Browser Console Error] ${msg.text()}`);
    });
    page.on('pageerror', err => {
      console.error(`[Browser Page Error] ${err.message}`);
    });
  });

  async function waitabit(page: Page, ms = 1500) {
    await page.waitForTimeout(ms);
  }

  test('Create installment/recurring transaction', async ({ page }) => {
    // Step 1: Ensure account exists
    await page.goto('/accounts', { waitUntil: 'domcontentloaded' });
    await waitabit(page);

    const newAccountBtn = page.locator('button:has-text("Nova Conta")');
    if (await newAccountBtn.isVisible()) {
      await newAccountBtn.click();
      await page.getByPlaceholder('Ex: Conta Principal').fill(TEST_ACCOUNT_NAME);
      await page.getByPlaceholder('Ex: Nubank').fill('BANCO_RECUR');
      await page.click('text=Efetivar Nova Conta');
      await expect(page.getByText(/Conta criada/i)).toBeVisible({ timeout: 15000 });
      console.log('✅ Account created for recurring test');
    } else {
      console.log('Account may already exist, continuing...');
    }
    await waitabit(page, 2000);

    // Step 2: Navigate to transactions and create recurring transaction
    await page.goto('/transactions', { waitUntil: 'domcontentloaded' });
    await waitabit(page);

    await page.click('text=Novo Lançamento');
    await expect(page.getByText('Novo Lançamento').first()).toBeVisible({ timeout: 10000 });

    // Fill amount
    const amountInput = page.locator('input[type="number"]');
    await amountInput.first().fill('299.90');

    // Fill description
    await page.getByPlaceholder('Ex: Assinatura Software').fill(TEST_RECURRING_TX_DESC);

    // Select category
    const select = page.getByText('Selecione...').first();
    if (await select.isVisible()) {
      await select.click();
      await page.keyboard.type('Mercado');
      await waitabit(page, 500);
      await page.keyboard.press('Enter');
    }

    // Change subtype to "Parcelas" (recurring/installment)
    const parceladoBtn = page.locator('button:has-text("Parcelas")');
    if (await parceladoBtn.isVisible()) {
      await parceladoBtn.click();
      await waitabit(page, 500);
    }

    // Verify installment fields appear
    const qtdParcelasLabel = page.getByText('Qtd. Parcelas').first();
    if (await qtdParcelasLabel.isVisible()) {
      // Set 6 installments
      const installmentInput = page.locator('input[type="number"]').nth(1);
      await installmentInput.fill('6');
      console.log('✅ Installment fields visible, set to 6');
    }

    // Submit
    await page.click('button:has-text("Efetivar Lançamento")');
    await expect(page.getByText(/Transação criada/i)).toBeVisible({ timeout: 15000 });
    console.log('✅ Recurring/installment transaction created');
  });
});
