import { test, expect } from '@playwright/test';

const URL =
  'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login';

test.beforeEach(async ({ page }) => {

  await page.goto(URL, {
    waitUntil: 'domcontentloaded',
    timeout: 120000
  });

});

test('Valid Login', async ({ page }) => {

  await page.locator('input[name="username"]')
    .fill('Admin');

  await page.locator('input[name="password"]')
    .fill('admin123');

  await page.locator('button[type="submit"]')
    .click();

  await expect(page.locator('h6'))
    .toContainText('Dashboard');
});

test('Invalid Login', async ({ page }) => {

  await page.locator('input[name="username"]')
    .fill('Admi');

  await page.locator('input[name="password"]')
    .fill('admin12');

  await page.locator('button[type="submit"]')
    .click();

  await expect(page.locator('body'))
    .toContainText('Invalid');
});

test('Empty Username', async ({ page }) => {

  await page.locator('input[name="password"]')
    .fill('admin123');

  await page.locator('button[type="submit"]')
    .click();

  await expect(page.locator('body'))
    .toContainText('Required');
});

test('Empty Password', async ({ page }) => {

  await page.locator('input[name="username"]')
    .fill('Admin');

  await page.locator('button[type="submit"]')
    .click();

  await expect(page.locator('body'))
    .toContainText('Required');
});

test('Empty Credentials', async ({ page }) => {

  await page.locator('button[type="submit"]')
    .click();

  await expect(page.locator('body'))
    .toContainText('Required');
});


test('Forgot Password', async ({ page }) => {

  await page.locator('.orangehrm-login-forgot-header')
    .click();

  await expect(page)
    .toHaveURL(/requestPasswordResetCode/);
});
test('Logout', async ({ page }) => {

  await page.locator('input[name="username"]').fill('Admin');
  await page.locator('input[name="password"]').fill('admin123');

  await page.locator('button[type="submit"]').click();

  // Wait until dashboard page is loaded
  await expect(page).toHaveURL(/dashboard/);

  await expect(
    page.getByRole('heading', { name: 'Dashboard' })
  ).toBeVisible();

  await page.locator('.oxd-userdropdown-tab').click();

  await page.getByText('Logout').click();

  await expect(page).toHaveURL(/login/);
});