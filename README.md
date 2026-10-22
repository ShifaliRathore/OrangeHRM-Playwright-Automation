# OrangeHRM Playwright Automation

End-to-end test automation suite for the [OrangeHRM](https://opensource-demo.orangehrmlive.com) demo application, built with **Playwright** and **JavaScript** following the **Page Object Model (POM)** pattern.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Project Structure](#project-structure)
5. [Page Objects](#page-objects)
6. [Test Modules & Test Cases](#test-modules--test-cases)
   - [Login](#1-login)
   - [Dashboard](#2-dashboard)
   - [Admin](#3-admin)
   - [Leave Configuration](#4-leave-configuration)
   - [PIM (Personnel Information Management)](#5-pim-personnel-information-management)
   - [Time](#6-time)
   - [Recruitment — Happy Path](#7-recruitment--happy-path)
   - [Recruitment — Validation](#8-recruitment--validation)
7. [Test Results Summary](#test-results-summary)
8. [How to Run Tests](#how-to-run-tests)
9. [Viewing the HTML Report](#viewing-the-html-report)
10. [Configuration](#configuration)
11. [CI/CD Pipeline](#cicd-pipeline)
12. [Java Source Files (Reference)](#java-source-files-reference)

---

## Project Overview

This project automates functional testing of the **OrangeHRM** open-source HR management system. It covers 8 modules across 55 test cases, validating everything from login flows and admin user management to a full end-to-end recruitment hiring pipeline.

| Application URL | https://opensource-demo.orangehrmlive.com |
|---|---|
| Test User | `Admin` / `admin123` |
| Browser | Chromium (Desktop Chrome) |
| Execution Mode | Serial (1 worker) |
| Total Test Cases | **55** |
| Last Run Result | **55 Passed / 0 Failed** |

---

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| [Playwright](https://playwright.dev) | `^1.64.1` | Browser automation & test framework |
| Node.js | LTS | JavaScript runtime |
| JavaScript (ESM) | ES2020+ | Test language |
| `@types/node` | `^26.6.5` | TypeScript type hints in JS |
| GitHub Actions | — | CI/CD pipeline |

---

## Prerequisites

- **Node.js** LTS or later — [Download](https://nodejs.org)
- **npm** (comes with Node.js)

```bash
# Verify installations
node --version
npm --version
```

---

## Project Structure

```
OrangeHRM-Playwright-Automation/
│
├── pages/                          # Page Object Model classes
│   ├── LoginPage.js                # Login form actions
│   ├── DashboardPage.js            # Dashboard visibility helpers
│   ├── AdminPage.js                # Admin > System Users actions
│   ├── LeaveConfigPage.js          # Leave Types / Work Week / Holidays / Period
│   └── RecruitmentPage.js          # Full Recruitment module actions
│
├── tests/                          # Playwright spec files
│   ├── login.spec.js               # Login module tests
│   ├── dashboard.spec.js           # Dashboard module tests
│   ├── admin.spec.js               # Admin module tests
│   ├── leaveConfig.spec.js         # Leave configuration tests
│   ├── PIMModule.spec.js           # PIM module tests
│   ├── time.spec.js                # Time module tests
│   ├── recruitment.spec.js         # Recruitment happy-path tests
│   └── recruitmentValidation.spec.js # Recruitment validation/negative tests
│
├── playwright-report/              # Auto-generated HTML report (latest run)
├── presentation-report/            # Saved copy of the report for sharing
├── test-results/                   # Screenshots & traces on failure
│
├── playwright.config.js            # Playwright configuration
├── package.json                    # Project dependencies & metadata
├── .github/workflows/playwright.yml # GitHub Actions CI pipeline
│
# Java source files (reference only — not executed by Playwright)
├── RecruitmentPage.java            # Original Selenium Page Object
├── RecruitmentTest.java            # Original TestNG happy-path tests
└── RecruitmentValidationTest.java  # Original TestNG validation tests
```

---

## Page Objects

All page objects live in `pages/` and encapsulate locators and actions for each module. Tests import and use these classes rather than interacting with the browser directly.

### `LoginPage.js`
Handles navigation to the login page, filling credentials and submitting the form.
- `navigate()` — goes to the login URL
- `login(username, password)` — fills and submits the login form

### `DashboardPage.js`
Thin wrapper for post-login dashboard checks.
- `isDashboardVisible()` — returns true if the `h6` heading is visible

### `AdminPage.js`
Covers the Admin > System Users section including login, navigation, search, and add-user form.
- `login(username, password)` — logs in and asserts dashboard URL
- `openUsersPage()` — navigates directly to the System Users list
- `searchByUsername(username)` — fills the username filter and clicks Search
- `clickAdd()` / `clickSave()` — opens and submits the Add User form

### `LeaveConfigPage.js`
Covers all four Leave configuration sub-pages.
- `goToLeaveTypes()` / `goToWorkWeek()` / `goToHolidayList()` / `goToLeavePeriod()`
- `getLeaveTypeCount()` — returns the number of leave type rows
- `expectHolidaySearchResultValid()` — asserts rows or "No Records Found" is shown

### `RecruitmentPage.js`
The most comprehensive page object — covers the entire Recruitment module.
- **Navigation**: `openRecruitment()`, `openCandidates()`, `openVacancies()`, `openEmployeeList()`
- **Vacancy**: `addVacancy()`, `searchVacancy()`, `isVacancyListed()`, `isVacancyActive()`, `deleteVacancy()`
- **Candidate**: `addCandidate()`, `searchCandidate()`, `isCandidateListed()`, `deleteCandidate()`
- **Pipeline**: `shortlistCandidate()`, `scheduleInterview()`, `markInterviewPassed()`, `offerJob()`, `hireCandidate()`
- **PIM check**: `searchEmployee()`, `isEmployeeListed()`
- **Utilities**: `hasStatus()`, `isSuccessMessageDisplayed()`, `cancelForm()`

---

## Test Modules & Test Cases

### 1. Login
**File:** `tests/login.spec.js`  
**Strategy:** Inline locators, `beforeEach` navigates to login URL each time.

| # | Test Case | Expected Result | Status |
|---|---|---|---|
| 1 | Valid Login | Dashboard heading visible, URL contains `/dashboard` | ✅ Pass |
| 2 | Invalid Login | Error message containing "Invalid" is displayed | ✅ Pass |
| 3 | Empty Username | "Required" validation message shown | ✅ Pass |
| 4 | Empty Password | "Required" validation message shown | ✅ Pass |
| 5 | Empty Credentials | "Required" validation message shown | ✅ Pass |
| 6 | Forgot Password | Redirected to `/requestPasswordResetCode` | ✅ Pass |
| 7 | Logout | After login and logout, URL returns to `/login` | ✅ Pass |

---

### 2. Dashboard
**File:** `tests/dashboard.spec.js`  
**Strategy:** Uses `LoginPage` + `DashboardPage` POMs. `beforeEach` logs in before every test.

| # | Test Case | Expected Result | Status |
|---|---|---|---|
| TC01 | Verify Dashboard opens | `h6` contains "Dashboard", `isDashboardVisible()` returns true | ✅ Pass |
| TC02 | Verify Time menu is displayed | "Time" link visible in sidebar | ✅ Pass |
| TC03 | Verify profile dropdown displays Logout | Clicking user avatar shows "Logout" option | ✅ Pass |
| TC04 | Verify Dashboard after navigating from Time | Navigate to Time, go back, URL is dashboard again | ✅ Pass |

---

### 3. Admin
**File:** `tests/admin.spec.js`  
**Strategy:** Uses `AdminPage` POM. Single shared browser session via `beforeAll` (login once).

| # | Test Case | Expected Result | Status |
|---|---|---|---|
| TC01 | Admin module opens | Module header = "Admin", System Users heading and table rows visible | ✅ Pass |
| TC02 | Search user with valid username | Searching "Admin" returns at least one row containing "Admin" | ✅ Pass |
| TC03 | Search user with invalid username | "No Records Found" shown, table has 0 rows | ✅ Pass |
| TC04 | Add User form shows Required errors when empty | Clicking Save on empty form shows "Required" error | ✅ Pass |

---

### 4. Leave Configuration
**File:** `tests/leaveConfig.spec.js`  
**Strategy:** Uses `LeaveConfigPage` POM. Single shared session via `beforeAll`.

| # | Test Case | Expected Result | Status |
|---|---|---|---|
| TC-LT-01 | Leave Types page loads | "Leave Types" heading is visible | ✅ Pass |
| TC-LT-02 | Leave Types table has at least one leave type | Row count > 0 (found 10 in last run) | ✅ Pass |
| TC-LT-03 | Leave Types Add button is displayed | "+ Add" button is visible | ✅ Pass |
| TC-WW-01 | Work Week page loads | "Work Week" heading is visible | ✅ Pass |
| TC-WW-02 | Work Week renders all 7 day rows | Exactly 7 form rows present | ✅ Pass |
| TC-WW-03 | Work Week Save button is displayed | "Save" button is visible | ✅ Pass |
| TC-HO-01 | Holidays page loads | "Holidays" heading is visible | ✅ Pass |
| TC-HO-02 | Holiday Search and Reset buttons displayed | Both buttons visible after page load | ✅ Pass |
| TC-HO-03 | Holiday Add button is displayed | "+ Add" button is visible | ✅ Pass |
| TC-HO-04 | Holiday search with no filters renders valid state | Either holiday rows or "No Records Found" shown | ✅ Pass |
| TC-LP-01 | Leave Period page loads | "Leave Period" heading is visible | ✅ Pass |
| TC-LP-02 | Leave Period Save button is displayed | "Save" button is visible | ✅ Pass |

---

### 5. PIM (Personnel Information Management)
**File:** `tests/PIMModule.spec.js`  
**Strategy:** Uses inline Playwright locators. `beforeEach` logs in and navigates to PIM.

| # | Test Case | Expected Result | Status |
|---|---|---|---|
| TC01 | Verify PIM page opens | "PIM" heading is visible | ✅ Pass |
| TC02 | Verify Employee Information heading | "Employee Information" heading is visible | ✅ Pass |
| TC03 | Verify Add Employee page opens | Clicking Add shows "Add Employee" heading | ✅ Pass |
| TC04 | Verify Employee Name search field | Autocomplete input ("Type for hints...") is visible | ✅ Pass |
| TC05 | Verify Employee ID search field | Second text input in the search form is visible | ✅ Pass |
| TC06 | Verify no records for nonexistent employee | Searching a random name shows "No Records Found" | ✅ Pass |

---

### 6. Time
**File:** `tests/time.spec.js`  
**Strategy:** Uses `LoginPage` POM. `beforeEach` logs in before every test.

| # | Test Case | Expected Result | Status |
|---|---|---|---|
| TC05 | Verify Time page opens | Clicking Time link changes URL to `/time/...` | ✅ Pass |
| TC06 | Verify Timesheets page opens | "Timesheets" text is visible on the Time page | ✅ Pass |
| TC07 | Verify Employee Name field is displayed | "Employee Name" label visible on Time page | ✅ Pass |
| TC08 | Verify Pending Action section is displayed | "Pending Actions" section visible on Dashboard | ✅ Pass |

---

### 7. Recruitment — Happy Path
**File:** `tests/recruitment.spec.js`  
**Strategy:** Uses `RecruitmentPage` POM. Single shared session via `beforeAll`. Tests run in **serial order** — each depends on the previous. Unique data generated per run using `Date.now()` and `Math.random()`.

| # | Test Case | Expected Result | Status |
|---|---|---|---|
| TC01 | Create and verify the unique QA vacancy | Vacancy created, appears in search results as "Active" | ✅ Pass |
| TC02 | Add a candidate and verify the initial application | Candidate saved, status = "Application Initiated" | ✅ Pass |
| TC03 | Shortlist the candidate | Status changes to "Shortlisted" | ✅ Pass |
| TC04 | Schedule the candidate interview | Status changes to "Interview Scheduled" | ✅ Pass |
| TC05 | Mark the interview as passed | Status changes to "Interview Passed" | ✅ Pass |
| TC06 | Offer the candidate the job | Status changes to "Job Offered" | ✅ Pass |
| TC07 | Hire the candidate | Status changes to "Hired" | ✅ Pass |
| TC08 | Verify the hired employee appears in PIM | Hired candidate found in PIM Employee List | ✅ Pass |
| TC09 | Delete the test vacancy | Vacancy removed from the vacancies list | ✅ Pass |

---

### 8. Recruitment — Validation
**File:** `tests/recruitmentValidation.spec.js`  
**Strategy:** Uses `RecruitmentPage` POM. Each test gets a **fresh browser context** via `beforeEach` (mirrors `@BeforeMethod` in the original Java TestNG suite). Cleanup runs in `afterEach`.

| # | Test Case | Expected Result | Status |
|---|---|---|---|
| V01 | Candidate form rejects empty submission | Required-field errors shown, at least one says "Required" | ✅ Pass |
| V02 | Candidate form rejects invalid email format | Email field shows a validation error | ✅ Pass |
| V03 | Vacancy form requires mandatory fields | Vacancy Name, Job Title, Hiring Manager all show "Required" | ✅ Pass |
| V04 | Candidate search with unknown name shows validation | Candidate Name field marked invalid when name not in autocomplete | ✅ Pass |
| V05 | Vacancy filters find the active vacancy | Filtering by vacancy name + "Active" status returns the correct row | ✅ Pass |
| V06 | Interview form requires mandatory fields | Interview Title, Interviewer, Date all show "Required" | ✅ Pass |
| V07 | Candidate can be rejected from Application Initiated | Clicking Reject → confirming changes status to "Rejected" | ✅ Pass |
| V08 | Candidate form rejects unsupported resume file type | File type validation error shown for `.jpg` resume | ✅ Pass |
| V09 | Candidate form rejects resume file over 1 MB | File size validation error shown for file > 1 MB | ✅ Pass |

---

## Test Results Summary

| Module | Spec File | Tests | Passed | Failed |
|---|---|---|---|---|
| Login | `login.spec.js` | 7 | 7 | 0 |
| Dashboard | `dashboard.spec.js` | 4 | 4 | 0 |
| Admin | `admin.spec.js` | 4 | 4 | 0 |
| Leave Config | `leaveConfig.spec.js` | 12 | 12 | 0 |
| PIM | `PIMModule.spec.js` | 6 | 6 | 0 |
| Time | `time.spec.js` | 4 | 4 | 0 |
| Recruitment (Happy Path) | `recruitment.spec.js` | 9 | 9 | 0 |
| Recruitment (Validation) | `recruitmentValidation.spec.js` | 9 | 9 | 0 |
| **Total** | | **55** | **55** | **0** |

> **All 55 test cases pass on every run.**

---

## How to Run Tests

### Install dependencies (first time only)

```bash
cd OrangeHRM-Playwright-Automation
npm install
npx playwright install chromium
```

### Run all 55 tests

```bash
npx playwright test
```

### Run a specific module

```bash
npx playwright test login.spec.js
npx playwright test dashboard.spec.js
npx playwright test admin.spec.js
npx playwright test leaveConfig.spec.js
npx playwright test PIMModule.spec.js
npx playwright test time.spec.js
npx playwright test recruitment.spec.js
npx playwright test recruitmentValidation.spec.js
```

### Run recruitment tests only (both files together)

```bash
npx playwright test recruitment.spec.js recruitmentValidation.spec.js
```

### Run in headed mode (watch the browser)

```bash
npx playwright test --headed
```

### Run with verbose output

```bash
npx playwright test --reporter=list
```

### Clean up recruitment test data after run

By default the recruitment tests do **not** delete created data (so you can inspect it). To clean up automatically:

```bash
CLEANUP_RECRUITMENT_DATA=true npx playwright test recruitment.spec.js
```

---

## Viewing the HTML Report

After any test run, Playwright generates a full interactive HTML report.

### Open the latest auto-generated report

```bash
npx playwright show-report
```

Opens at **http://localhost:9323** in your browser.

### Open the saved presentation copy

```bash
npx playwright show-report presentation-report
```

The `presentation-report/` folder is a **static snapshot** of the last 55/55 passing run — ideal for sharing or presenting without needing to re-run tests.

> ⚠️ Always share the **entire `presentation-report/` folder** (including `data/`), never just the `index.html` file on its own.

---

## Configuration

All Playwright settings live in [`playwright.config.js`](playwright.config.js).

| Setting | Value | Reason |
|---|---|---|
| `testDir` | `./tests` | Where spec files are located |
| `timeout` | 120 000 ms | OrangeHRM demo site can be slow |
| `expect.timeout` | 15 000 ms | Generous assertion wait |
| `workers` | `1` | Serial execution — tests share state |
| `fullyParallel` | `false` | Serial execution |
| `reporter` | `html` | Generates `playwright-report/` |
| `headless` | `true` | No visible browser during CI runs |
| `screenshot` | `only-on-failure` | Screenshots captured when a test fails |
| `video` | `retain-on-failure` | Video kept when a test fails |
| `trace` | `on-first-retry` | Trace captured on first retry |
| `actionTimeout` | 30 000 ms | Per-action timeout |
| `navigationTimeout` | 120 000 ms | Page load timeout |
| `browser` | Chromium | Desktop Chrome profile |

---

## CI/CD Pipeline

**File:** `.github/workflows/playwright.yml`

The pipeline runs automatically on every **push** and **pull request** to `main` or `master`.

```
Trigger → Checkout → Setup Node.js (LTS) → npm ci
       → Install Playwright browsers → Run all tests
       → Upload HTML report as artifact (retained 30 days)
```

The HTML report is uploaded as a GitHub Actions artifact named `playwright-report` after every run, whether tests pass or fail.

---

## Java Source Files (Reference)

The three Java files in the project root are the **original Selenium/TestNG implementation** of the Recruitment module. They are provided as reference only and are not executed by Playwright.

| File | Framework | Description |
|---|---|---|
| `RecruitmentPage.java` | Selenium WebDriver | Page Object with full Recruitment module actions |
| `RecruitmentTest.java` | TestNG | End-to-end happy-path hiring workflow |
| `RecruitmentValidationTest.java` | TestNG | Negative validation tests (empty forms, bad files, etc.) |

These were ported 1-to-1 into:
- `pages/RecruitmentPage.js` ← from `RecruitmentPage.java`
- `tests/recruitment.spec.js` ← from `RecruitmentTest.java`
- `tests/recruitmentValidation.spec.js` ← from `RecruitmentValidationTest.java`

Key differences in the port:

| Java / Selenium | JavaScript / Playwright |
|---|---|
| `WebDriverWait` + `ExpectedConditions` | `expect(...).toBeVisible/Enabled()` |
| `By.xpath(...)` / `By.cssSelector(...)` | `page.locator(xpath)` / `page.getByRole()` |
| `element.sendKeys(value)` | `locator.fill(value)` |
| `element.getDomProperty("value")` | `locator.inputValue()` |
| `input[type=file].sendKeys(path)` | `locator.setInputFiles(path)` |
| `StaleElementReferenceException` retries | Not needed — Playwright auto-retries |
| `@BeforeClass` / `@AfterClass` | `test.beforeAll` / `test.afterAll` |
| `@BeforeMethod` / `@AfterMethod` | `test.beforeEach` / `test.afterEach` |
| `dependsOnMethods` (TestNG) | `serial` mode (ordered execution) |
| `ThreadLocalRandom.current().nextInt()` | `Math.random()` |
| `Files.createTempFile()` + `Files.writeString()` | `fs/promises` `writeFile()` |

---

*Last updated after full 55/55 passing run on OrangeHRM demo — `opensource-demo.orangehrmlive.com`*
