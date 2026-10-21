
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';

test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login('Admin', 'admin123');

  await expect(page).toHaveURL(/dashboard/);
});

test('TC01 - Verify Dashboard opens', async ({ page }) => {
  const dashboardPage = new DashboardPage(page);

  await expect(page.locator('h6'))
    .toContainText('Dashboard');

  await expect.poll(() => dashboardPage.isDashboardVisible())
    .toBe(true);
});

test('TC02 - Verify Time menu is displayed', async ({ page }) => {
  await expect(page.getByText('Time', { exact: true }).first())
    .toBeVisible();
});

test('TC03 - Verify profile dropdown displays Logout', async ({ page }) => {
  await page.locator('.oxd-userdropdown-tab').click();

  await expect(page.getByText('Logout', { exact: true }))
    .toBeVisible();
});

test('TC04 - Verify Dashboard after navigating from Time', async ({ page }) => {
  await page.getByText('Time', { exact: true }).first().click();

  await expect(page).toHaveURL(/time/);

  await page.goBack();

  await expect(page).toHaveURL(/dashboard/);
  await expect(page.locator('h6')).toContainText('Dashboard');
});
