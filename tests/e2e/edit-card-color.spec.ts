import { test, expect } from '@playwright/test';

test.describe('Debug: Edit Card Color', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.route('**/*', async route => {
      const headers = { ...route.request().headers(), 'x-debug-bypass': 'debug-token-default' };
      await route.continue({ headers });
    });
  });

  test('Should change card color successfully', async ({ page }) => {
    await page.goto('/credit-cards', { waitUntil: 'load' });
    console.log('Page loaded.');
    
    // Wait for either cards or empty state
    await page.waitForTimeout(2000);

    const editButton = page.locator('button').filter({ has: page.locator('svg.lucide-pencil') }).first();
    
    if (await editButton.isHidden()) {
        console.log('No cards found. Creating one...');
        await page.click('text=Novo Cartão');
        await page.getByPlaceholder('Ex: Nubank, Inter').fill('TEST BANK');
        await page.getByPlaceholder('Ex: Cartão Principal').fill('COLOR TEST CARD');
        await page.getByPlaceholder('1234').fill('0000');
        await page.getByPlaceholder('5000.00').fill('1000');
        await page.click('button:has-text("Salvar Cartão")');
        await expect(page.getByText(/Cartão criado/i)).toBeVisible({ timeout: 15000 });
        console.log('Temp card created.');
        await page.waitForTimeout(1000);
    }

    console.log('Opening Edit Modal...');
    await editButton.click({ force: true });
    await expect(page.getByText(/Editar Cartão/i)).toBeVisible();

    console.log('Changing Color...');
    const colorButtons = page.locator('button.rounded-full');
    // Ensure buttons are loaded
    await colorButtons.first().waitFor();
    await colorButtons.nth(1).click();
    
    console.log('Saving...');
    await page.click('button:has-text("Salvar Cartão")', { force: true });

    console.log('Waiting for toast...');
    await expect(page.getByText(/Cartão atualizado/i)).toBeVisible({ timeout: 15000 });
    console.log('✅ Success!');
  });
});