import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { LeaveConfigPage } from '../pages/LeaveConfigPage.js';

// Run the tests in order, in one shared browser window
test.describe.configure({ mode: 'serial', timeout: 120000 });

let context;
let page;
let leaveConfigPage;

// Login ONCE as Admin before all tests (all config pages are Admin-only)
test.beforeAll(async ({ browser }) => {
  test.setTimeout(120000);

  context = await browser.newContext();
  page = await context.newPage();
  leaveConfigPage = new LeaveConfigPage(page);

  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login('Admin', 'admin123');
  await expect(page).toHaveURL(/dashboard/);
});

test.afterAll(async () => {
  await context.close();
});

// -------------------------------------------------------
// LEAVE TYPES
// -------------------------------------------------------

test('TC-LT-01 - Leave Types page loads', async () => {
  await leaveConfigPage.goToLeaveTypes();

  await expect(leaveConfigPage.leaveTypesHeading).toBeVisible();
});

test('TC-LT-02 - Leave Types table has at least one leave type', async () => {
  await leaveConfigPage.goToLeaveTypes();

  await expect(leaveConfigPage.tableRows.first()).toBeVisible();
  const count = await leaveConfigPage.getLeaveTypeCount();
  expect(count).toBeGreaterThan(0);
  console.log(`TC-LT-02: ${count} leave type(s) found`);
});

test('TC-LT-03 - Leave Types Add button is displayed', async () => {
  await leaveConfigPage.goToLeaveTypes();

  await expect(leaveConfigPage.addButton).toBeVisible();
});

// -------------------------------------------------------
// WORK WEEK
// -------------------------------------------------------

test('TC-WW-01 - Work Week page loads', async () => {
  await leaveConfigPage.goToWorkWeek();

  await expect(leaveConfigPage.workWeekHeading).toBeVisible();
});

test('TC-WW-02 - Work Week page renders all 7 day rows', async () => {
  await leaveConfigPage.goToWorkWeek();

  await expect(leaveConfigPage.workWeekFormRows).toHaveCount(7);
});

test('TC-WW-03 - Work Week Save button is displayed', async () => {
  await leaveConfigPage.goToWorkWeek();

  await expect(leaveConfigPage.saveButton).toBeVisible();
});

// -------------------------------------------------------
// HOLIDAY LIST
// -------------------------------------------------------

test('TC-HO-01 - Holidays page loads', async () => {
  await leaveConfigPage.goToHolidayList();

  await expect(leaveConfigPage.holidayListHeading).toBeVisible();
});

test('TC-HO-02 - Holiday Search and Reset buttons are displayed', async () => {
  await leaveConfigPage.goToHolidayList();

  await expect(leaveConfigPage.holidayListHeading).toBeVisible();
  await expect(leaveConfigPage.holidaySearchButton).toBeVisible();
  await expect(leaveConfigPage.holidayResetButton).toBeVisible();
});

test('TC-HO-03 - Holiday Add button is displayed', async () => {
  await leaveConfigPage.goToHolidayList();

  await expect(leaveConfigPage.addButton).toBeVisible();
});

test('TC-HO-04 - Holiday search with no filters renders a valid state', async () => {
  await leaveConfigPage.goToHolidayList();
  await expect(leaveConfigPage.holidayListHeading).toBeVisible();

  await leaveConfigPage.clickHolidaySearch();

  // Either holiday rows or "No Records Found" is acceptable
  await leaveConfigPage.expectHolidaySearchResultValid();
});

// -------------------------------------------------------
// LEAVE PERIOD
// -------------------------------------------------------

test('TC-LP-01 - Leave Period page loads', async () => {
  await leaveConfigPage.goToLeavePeriod();

  await expect(leaveConfigPage.leavePeriodHeading).toBeVisible();
});

test('TC-LP-02 - Leave Period Save button is displayed', async () => {
  await leaveConfigPage.goToLeavePeriod();

  await expect(leaveConfigPage.saveButton).toBeVisible();
});
