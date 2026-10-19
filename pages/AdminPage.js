import { expect } from '@playwright/test';

export class AdminPage {

  constructor(page) {
    this.page = page;

    this.loginUrl =
      'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login';
    this.adminUrl =
      'https://opensource-demo.orangehrmlive.com/web/index.php/admin/viewSystemUsers';

    // Login locators (kept here so this page does not depend on LoginPage.js)
    this.loginUsername = page.locator('input[name="username"]');
    this.loginPassword = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]');

    // Admin / System Users locators
    this.moduleHeader = page.locator('.oxd-topbar-header-breadcrumb-module');
    this.pageHeading = page.getByRole('heading', { name: 'System Users' });
    this.recordsLabel = page.getByText(/Records? Found/).first();
    this.searchUsernameInput = page
      .locator('.oxd-input-group', { hasText: 'Username' })
      .locator('input');
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.tableRows = page.locator('.oxd-table-body .oxd-table-card');
    this.noRecordsText = page.getByText('No Records Found').first();

    // Add User locators
    this.addButton = page.getByRole('button', { name: 'Add' });
    this.saveButton = page.getByRole('button', { name: 'Save' });
    this.addUserHeading = page.getByRole('heading', { name: 'Add User' });
    this.errorMessages = page.locator('.oxd-input-field-error-message');
  }

  async login(username, password) {
    await this.page.goto(this.loginUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    });
    await this.loginUsername.fill(username);
    await this.loginPassword.fill(password);
    await this.loginButton.click();
    await expect(this.page).toHaveURL(/dashboard/);
  }

  // Opens the Users list directly (session must already be logged in)
  async openUsersPage() {
    await this.page.goto(this.adminUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    });
    await expect(this.page).toHaveURL(/viewSystemUsers/);
    await expect(this.pageHeading).toBeVisible();
    await expect(this.recordsLabel).toBeVisible();
  }

  async searchByUsername(username) {
    await this.searchUsernameInput.fill(username);
    await this.searchButton.click();
  }

  async clickAdd() {
    await this.addButton.click();
  }

  async clickSave() {
    await this.saveButton.click();
  }
}