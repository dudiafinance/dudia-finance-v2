import { test, expect, type Page } from '@playwright/test';

const TEST_CARD_NAME = `TEST_PMT_${Date.now()}`;
const TEST_ACCOUNT_NAME = `TEST_ACC_${Date.now()}`;
const TEST_TX_DESC = 'TEST_PURCHASE_E2E';

test.describe('Payment Flow E2E', { mode: 'serial' }, () => {

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

  async function waitabit(page: Page, ms = 500) {
    await page.waitForTimeout(ms);
  }

  test('Full Flow: Create Card -> Launch Purchase', async ({ page }) => {
    // Step 1: Create an account to pay the invoice from
    await page.goto('/accounts', { waitUntil: 'domcontentloaded' });
    await waitabit(page);

    const newAccountBtn = page.locator('button:has-text("Nova Conta")');
    if (await newAccountBtn.isVisible()) {
      await newAccountBtn.click();
      await page.getByPlaceholder('Ex: Conta Principal').fill(TEST_ACCOUNT_NAME);
      await page.getByPlaceholder('Ex: Nubank').fill('BANCO_PAYMENT');
      await page.click('text=Efetivar Nova Conta');
      await expect(page.getByText(/Conta criada/i)).toBeVisible({ timeout: 15000 });
      console.log('✅ Account created');
    } else {
      console.log('Account may already exist, continuing...');
    }
    await waitabit(page);

    // Step 2: Create Credit Card
    await page.goto('/credit-cards', { waitUntil: 'domcontentloaded' });
    await waitabit(page);

    await page.click('text=Novo Cartão');
    await page.getByPlaceholder('Ex: Nubank, Inter').fill('BANCO_PAYMENT');
    await page.getByPlaceholder('Ex: Cartão Principal').fill(TEST_CARD_NAME);
    await page.getByPlaceholder('1234').fill('1234');
    await page.getByPlaceholder('5000.00').fill('5000');

    await page.click('button:has-text("Salvar Cartão")');
    await expect(page.getByText(/Cartão criado/i)).toBeVisible({ timeout: 15000 });
    console.log('✅ Credit Card created');

    await waitabit(page, 800);

    // Step 3: Reload page to ensure fresh state after card creation
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitabit(page, 800);

    // Select the card by clicking on it
    const cardElement = page.locator(`text=${TEST_CARD_NAME}`).first();
    await cardElement.waitFor({ state: 'visible', timeout: 10000 });
    await cardElement.click();
    await waitabit(page, 500);

    // Find the "Lançar Compra" button that opens the launch modal
    const launchBtn = page.locator('button').filter({ hasText: /Lançar Compra/ }).first();
    await launchBtn.waitFor({ state: 'visible', timeout: 15000 });
    await launchBtn.click();

    await expect(page.getByText('Novo Lançamento').first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Launch modal opened');

    // Fill purchase details - use the placeholder to target the correct amount input
    await page.getByPlaceholder('0,00').fill('150.00');
    await page.getByPlaceholder('Ex: Assinatura Software').fill(TEST_TX_DESC);

    // Select category - use keyboard navigation
    const select = page.getByText('Selecione...').first();
    if (await select.isVisible()) {
      await select.click();
      await page.keyboard.type('Mercado');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
    }

    await page.click('button:has-text("Efetivar Lançamento")');
    // Wait for success toast or modal to close
    try {
      await expect(page.getByText(/Lançamento criado|Transação criada/i)).toBeVisible({ timeout: 10000 });
      console.log('✅ Card purchase launched');
    } catch {
      // If no toast, check if modal closed (alternative success indicator)
      await expect(page.getByText('Novo Lançamento')).not.toBeVisible({ timeout: 5000 });
      console.log('✅ Card purchase launched (modal closed)');
    }

    console.log('✅ Payment flow completed successfully');
  });
});
