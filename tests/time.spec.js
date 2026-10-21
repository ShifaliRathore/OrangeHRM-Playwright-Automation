
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';

test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login('Admin', 'admin123');
  await expect(page).toHaveURL(/dashboard/);
});

test('TC05 - Verify Time page opens', async ({ page }) => {
  await page.getByText('Time', { exact: true }).first().click();
  await expect(page).toHaveURL(/time/);
});

test('TC06 - Verify Timesheets page opens', async ({ page }) => {
  await page.getByText('Time', { exact: true }).first().click();
  await expect(page.getByText('Timesheets', { exact: true }).first())
    .toBeVisible();
});

test('TC07 - Verify Employee Name field is displayed', async ({ page }) => {
  await page.getByText('Time', { exact: true }).first().click();
  await expect(page.getByText('Employee Name', { exact: true }).first())
    .toBeVisible();
});

test('TC08 - Verify Pending Action section is displayed', async ({ page }) => {
  await expect(page.getByText('Pending Actions', { exact: false }).first())
    .toBeVisible();
});
