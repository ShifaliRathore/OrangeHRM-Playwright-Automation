
const { test, expect } = require('@playwright/test');

const LOGIN_URL =
    'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login';

test.describe('OrangeHRM PIM Module Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(LOGIN_URL);

        await page.getByPlaceholder('Username').fill('Admin');
        await page.getByPlaceholder('Password').fill('admin123');
        await page.getByRole('button', { name: 'Login' }).click();

        // Wait for the dashboard to load
        await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });

        // Open PIM
        await page.getByRole('link', { name: 'PIM' }).click();

        // Verify the PIM employee list page
        await expect(page).toHaveURL(/pim\/viewEmployeeList/);
    });

    test('TC01 - Verify PIM page opens', async ({ page }) => {
        await expect(
            page.getByRole('heading', { name: 'PIM' })
        ).toBeVisible();
    });

    test('TC02 - Verify Employee Information heading', async ({ page }) => {
        await expect(
            page.getByRole('heading', { name: 'Employee Information' })
        ).toBeVisible();
    });

    test('TC03 - Verify Add Employee page opens', async ({ page }) => {
        await page.getByRole('button', { name: 'Add' }).click();

        await expect(
            page.getByRole('heading', { name: 'Add Employee' })
        ).toBeVisible();
    });

    test('TC04 - Verify Employee Name search field', async ({ page }) => {
        await expect(
            page.getByPlaceholder('Type for hints...').first()
        ).toBeVisible();
    });

    test('TC05 - Verify Employee ID search field', async ({ page }) => {
        await expect(
            page.locator('form').getByRole('textbox').nth(1)
        ).toBeVisible();
    });

    test('TC06 - Verify no records for nonexistent employee', async ({ page }) => {
        await page.getByPlaceholder('Type for hints...')
            .first()
            .fill('ZZZ_No_Such_Employee_987654');

        await page.getByRole('button', { name: 'Search' }).click();

        await expect(
            page.locator('span').filter({ hasText: 'No Records Found' })
        ).toBeVisible();
    });

});
