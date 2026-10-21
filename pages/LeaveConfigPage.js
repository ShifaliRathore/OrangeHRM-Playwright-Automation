import { expect } from '@playwright/test';

/**
 * LeaveConfigPage
 *
 * Page object for the four Leave Configuration pages of OrangeHRM
 * (converted from the Selenium LeaveConfigPage.java):
 *   Leave Types   - /leave/leaveTypeList
 *   Work Week     - /leave/defineWorkWeek
 *   Holiday List  - /leave/viewHolidayList
 *   Leave Period  - /leave/defineLeavePeriod
 *
 */
export class LeaveConfigPage {

  constructor(page) {
    this.page = page;

    const baseUrl = 'https://opensource-demo.orangehrmlive.com/web/index.php/leave/';
    this.leaveTypesUrl = baseUrl + 'leaveTypeList';
    this.workWeekUrl = baseUrl + 'defineWorkWeek';
    this.holidayListUrl = baseUrl + 'viewHolidayList';
    this.leavePeriodUrl = baseUrl + 'defineLeavePeriod';

    // Shared table / action locators
    this.tableRows = page.locator('.oxd-table-body .oxd-table-card');
    this.addButton = page.getByRole('button', { name: ' Add' });    
    this.saveButton = page.getByRole('button', { name: 'Save', exact: true });

    // Leave Types
    this.leaveTypesHeading = page.getByRole('heading', { name: 'Leave Types', exact: true });

    // Work Week
    this.workWeekHeading = page.getByText('Work Week', { exact: true }).first();
    this.workWeekFormRows = page.locator('.oxd-form-row');

    // Holiday List
    this.holidayListHeading = page.getByRole('heading', { name: 'Holidays', exact: true });
    this.holidaySearchButton = page.getByRole('button', { name: 'Search', exact: true });
    this.holidayResetButton = page.getByRole('button', { name: 'Reset', exact: true });
    this.noRecordsMessage = page.getByText('No Records Found').first();

    // Leave Period
    this.leavePeriodHeading = page.getByText('Leave Period', { exact: true }).first();
  }

  // ---------------------------------------------------------------
  // NAVIGATION
  // ---------------------------------------------------------------

  async goto(url) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  }

  async goToLeaveTypes() {
    await this.goto(this.leaveTypesUrl);
  }

  async goToWorkWeek() {
    await this.goto(this.workWeekUrl);
  }

  async goToHolidayList() {
    await this.goto(this.holidayListUrl);
  }

  async goToLeavePeriod() {
    await this.goto(this.leavePeriodUrl);
  }

  // ---------------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------------

  async clickHolidaySearch() {
    await this.holidaySearchButton.click();
  }

  // ---------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------

  async getLeaveTypeCount() {
    return await this.tableRows.count();
  }

  // Holiday search is valid when either rows OR "No Records Found" is shown
  async expectHolidaySearchResultValid() {
    await expect(
      this.tableRows.first().or(this.noRecordsMessage)
    ).toBeVisible();
  }
}
