import { test, expect, type Page } from '@playwright/test';

const TEST_ACCOUNT_NAME = 'TEST_DEBUG_ACC';
const TEST_TRANSACTION_DESC = 'DEBUG_TRANSACTION_TEST';
const TEST_BUDGET_NAME = 'DEBUG_BUDGET_TEST';
const TEST_CARD_NAME = 'DEBUG_CARD_TEST';
const TEST_GOAL_NAME = 'DEBUG_GOAL_TEST';

test.describe('Deep System Debug & Interaction', () => {
  
  test.beforeEach(async ({ page }) => {
    // Inject debug header into all requests (main frame + API fetches)
    await page.route('**/*', async route => {
      const headers = {
        ...route.request().headers(),
        'x-debug-bypass': 'debug-token-default',
      };
      await route.continue({ headers });
    });

    // Monitor errors
    page.on('console', msg => {
      if (msg.type() === 'error') console.error(`[Browser Console Error] ${msg.text()}`);
    });
    page.on('pageerror', err => {
      console.error(`[Browser Page Error] ${err.message}`);
    });
  });

  async function waitForLoading(page: Page) {
    const spinner = page.locator('.animate-spin');
    if (await spinner.isVisible()) {
        await spinner.waitFor({ state: 'hidden', timeout: 30000 });
    }
  }

  test('Debug Dashboard Loading', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'load' });
    await expect(page.getByText('Patrimônio Consolidado')).toBeVisible({ timeout: 15000 });
    console.log('✅ Dashboard loaded.');
  });

  test('Full Flow: Create Transaction', async ({ page }) => {
    await page.goto('/transactions', { waitUntil: 'load' });
    await waitForLoading(page);

    await page.click('text=Novo Lançamento');
    await expect(page.getByText('Novo Lançamento', { exact: true }).last()).toBeVisible({ timeout: 10000 });

    await page.locator('input[type="number"]').fill('123.45');
    await page.getByPlaceholder('Ex: Assinatura Software').fill(TEST_TRANSACTION_DESC);
    
    // Select category
    const select = page.getByText('Selecione...');
    if (await select.isVisible()) {
      await select.click();
      await page.keyboard.type('Mercado');
      await page.waitForTimeout(1000);
      await page.keyboard.press('Enter');
    }
    
    await page.click('text=Efetivar Lançamento');
    await expect(page.getByText(/Transação criada/i)).toBeVisible({ timeout: 15000 });
    console.log('✅ Transaction flow verified.');
  });

  test('Full Flow: Create Account', async ({ page }) => {
    await page.goto('/accounts', { waitUntil: 'load' });
    await waitForLoading(page);
    
    await page.click('text=Nova Conta');
    await page.getByPlaceholder('Ex: Conta Principal').fill(TEST_ACCOUNT_NAME);
    await page.getByPlaceholder('Ex: Nubank').fill('BANCO_TEST');
    
    await page.click('text=Efetivar Nova Conta');
    await expect(page.getByText(/Conta criada/i)).toBeVisible({ timeout: 15000 });
    console.log('✅ Account flow verified.');
  });

  test('Full Flow: Create Budget', async ({ page }) => {
    await page.goto('/budgets', { waitUntil: 'load' });
    await waitForLoading(page);

    await page.click('text=Novo Orçamento');
    await page.getByPlaceholder('Ex: Mercado & Alimentação').fill(TEST_BUDGET_NAME);
    await page.locator('input[type="number"]').fill('1000');
    
    await page.click('text=Efetivar Orçamento');
    await expect(page.getByText(/Orçamento criado/i)).toBeVisible({ timeout: 15000 });
    console.log('✅ Budget flow verified.');
  });

  test('Full Flow: Create Credit Card', async ({ page }) => {
    await page.goto('/credit-cards', { waitUntil: 'load' });
    await waitForLoading(page);

    await page.click('text=Novo Cartão');
    await page.getByPlaceholder('Ex: Nubank, Inter').fill('BANCO_TEST');
    await page.getByPlaceholder('Ex: Cartão Principal').fill(TEST_CARD_NAME);
    await page.getByPlaceholder('1234').fill('9999');
    await page.getByPlaceholder('5000.00').fill('5000');
    
    await page.click('text=Salvar Cartão');
    await expect(page.getByText(/Cartão criado/i)).toBeVisible({ timeout: 15000 });
    console.log('✅ Credit Card flow verified.');
  });

  test('Full Flow: Create Goal', async ({ page }) => {
    await page.goto('/goals', { waitUntil: 'load' });
    await waitForLoading(page);

    await page.click('text=Nova Meta');
    await page.getByPlaceholder('Ex: Reserva de Emergência').fill(TEST_GOAL_NAME);
    // There are multiple number inputs (Target, Initial, Monthly). 
    // We'll target them by order or label if possible.
    await page.locator('input[type="number"]').first().fill('10000'); // Target
    
    await page.click('text=Criar Nova Meta');
    await expect(page.getByText(/Meta criada/i)).toBeVisible({ timeout: 15000 });
    console.log('✅ Goal flow verified.');
  });

  test('Cleanup All Debug Data', async ({ page }) => {
    // This is a best-effort cleanup
    const modules = [
        { url: '/transactions', text: TEST_TRANSACTION_DESC, delBtn: 'svg.lucide-trash2' },
        { url: '/accounts', text: TEST_ACCOUNT_NAME, delBtn: 'svg.lucide-trash2' },
        { url: '/budgets', text: TEST_BUDGET_NAME, delBtn: 'svg.lucide-trash2' },
        { url: '/credit-cards', text: TEST_CARD_NAME, delBtn: 'svg.lucide-pencil' }, // Pencil to open edit, then find trash
        { url: '/goals', text: TEST_GOAL_NAME, delBtn: 'svg.lucide-trash2' }
    ];

    for (const mod of modules) {
        await page.goto(mod.url, { waitUntil: 'load' });
        await waitForLoading(page);
        const item = page.getByText(mod.text).first();
        if (await item.isVisible()) {
            await item.click();
            // Finding the trash icon inside the modal or page
            const trash = page.locator('button').filter({ has: page.locator('svg.lucide-trash2') }).first();
            if (await trash.isVisible()) {
                await trash.click();
                const confirm = page.locator('button:has-text("Excluir"), button:has-text("Remover")').first();
                if (await confirm.isVisible()) {
                    await confirm.click();
                    await page.waitForTimeout(1000);
                }
            }
        }
    }
    console.log('✅ Cleanup complete.');
  });
});