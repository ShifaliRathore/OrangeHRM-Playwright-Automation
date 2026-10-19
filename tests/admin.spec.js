import { test, expect } from '@playwright/test';
import { AdminPage } from '../pages/AdminPage.js';

// Run the tests in order, in one shared browser window
test.describe.configure({ mode: 'serial', timeout: 120000 });

let context;
let page;
let adminPage;

// Login ONCE before all tests
test.beforeAll(async ({ browser }) => {
  test.setTimeout(120000);

  context = await browser.newContext();
  page = await context.newPage();
  adminPage = new AdminPage(page);

  await adminPage.login('Admin', 'admin123');
});

test.afterAll(async () => {
  await context.close();
});

test('TC01 - Admin module opens', async () => {
  await adminPage.openUsersPage();

  await expect(adminPage.moduleHeader).toHaveText('Admin');
  await expect(adminPage.pageHeading).toBeVisible();
  await expect(adminPage.tableRows.first()).toBeVisible();
});

test('TC02 - Search user with valid username', async () => {
  await adminPage.openUsersPage();

  await adminPage.searchByUsername('Admin');

  await expect(adminPage.tableRows.first()).toContainText('Admin');
  expect(await adminPage.tableRows.count()).toBeGreaterThan(0);
});

test('TC03 - Search user with invalid username', async () => {
  await adminPage.openUsersPage();

  await adminPage.searchByUsername('zzNoSuchUser12345');

  await expect(adminPage.noRecordsText).toBeVisible();
  await expect(adminPage.tableRows).toHaveCount(0);
});

test('TC04 - Add User form shows Required errors when empty', async () => {
  await adminPage.openUsersPage();

  await adminPage.clickAdd();
  await expect(page).toHaveURL(/saveSystemUser/);
  await expect(adminPage.addUserHeading).toBeVisible();

  await adminPage.clickSave();
  await expect(adminPage.errorMessages.first()).toHaveText('Required');
});