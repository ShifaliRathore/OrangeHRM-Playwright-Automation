import { test, expect } from '@playwright/test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LoginPage } from '../pages/LoginPage.js';
import { RecruitmentPage } from '../pages/RecruitmentPage.js';

// Negative-input checks kept separate from the Recruitment happy-path workflow.
// Each test gets a fresh browser context (mirrors @BeforeMethod in the Java suite).
test.describe.configure({ timeout: 120000 });

const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min));

let context;
let page;
let recruitment;
let tempDir;
let testVacancyName;
let testCandidateFirstName;
let testCandidateLastName;
let testCandidateEmail;
let vacancyCreated;
let candidateCreated;

test.beforeEach(async ({ browser }) => {
  test.setTimeout(120000);

  context = await browser.newContext();
  page = await context.newPage();
  recruitment = new RecruitmentPage(page);

  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login('Admin', 'admin123');
  await expect(page.locator("xpath=//h6[normalize-space()='Dashboard']")).toBeVisible();
  await recruitment.openRecruitment();

  tempDir = await mkdtemp(join(tmpdir(), 'orangehrm-validation-'));
  testVacancyName = null;
  testCandidateFirstName = null;
  testCandidateLastName = null;
  testCandidateEmail = null;
  vacancyCreated = false;
  candidateCreated = false;
});

test.afterEach(async () => {
  test.setTimeout(120000);

  if (candidateCreated) {
    try {
      await recruitment.openRecruitment();
      await recruitment.deleteCandidate(`${testCandidateFirstName} ${testCandidateLastName}`);
    } catch (error) {
      console.error(`Validation candidate cleanup did not complete: ${error.message}`);
    }
  }
  if (vacancyCreated) {
    try {
      await recruitment.openRecruitment();
      await recruitment.deleteVacancy(testVacancyName);
    } catch (error) {
      console.error(`Validation vacancy cleanup did not complete: ${error.message}`);
    }
  }
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
  }
  await context.close();
});

// ---------- Helpers ----------

const addButton = () => page.locator("xpath=//button[normalize-space()='Add']");
const submitButton = () => page.locator("button[type='submit']").first();
const fieldErrors = () => page.locator('.oxd-input-field-error-message');

function errorFor(label) {
  return page.locator(
    `xpath=//label[normalize-space()='${label}']`
    + "/ancestor::div[contains(@class,'oxd-input-group')]"
    + "//span[contains(@class,'oxd-input-field-error-message')]"
  ).first();
}

async function openCandidateForm() {
  await addButton().click();
  await expect(page.locator('input[name="firstName"]')).toBeVisible();
}

async function createTestVacancy() {
  testVacancyName = `Validation Vacancy ${randomInt(100000, 1000000)}`;
  await recruitment.openVacancies();
  vacancyCreated = true; // Ensure cleanup runs if save succeeds but a later step fails.
  await recruitment.addVacancy(testVacancyName, 'QA Engineer', 'Validation test vacancy', 'a', '1');
}

async function createTestCandidate() {
  testCandidateFirstName = 'Validation';
  testCandidateLastName = `Candidate${randomInt(100000, 1000000)}`;
  testCandidateEmail = `validation${Date.now()}@example.com`;
  const resume = join(tempDir, 'validation-resume.txt');
  await writeFile(resume, 'Validation test resume');
  await recruitment.openCandidates();
  candidateCreated = true;
  await recruitment.addCandidate(
    testCandidateFirstName, testCandidateLastName, testCandidateEmail, testVacancyName, resume
  );
}

async function openAndFillCandidateForm() {
  await recruitment.openCandidates();
  await openCandidateForm();
  testCandidateFirstName = 'Validation';
  testCandidateLastName = `Upload${randomInt(100000, 1000000)}`;
  testCandidateEmail = `upload${Date.now()}@example.com`;
  await page.locator('input[name="firstName"]').fill(testCandidateFirstName);
  await page.locator('input[name="lastName"]').fill(testCandidateLastName);
  await recruitment.selectDropdown('Vacancy', testVacancyName);
  await recruitment.input('Email').fill(testCandidateEmail);
}

async function assertResumeValidation(...acceptedParts) {
  const toast = page.locator('.oxd-toast');
  await expect(fieldErrors().or(toast).first()).toBeVisible();
  const messages = [
    ...(await fieldErrors().allInnerTexts()),
    ...(await toast.allInnerTexts()),
  ].join(' ');
  const normalized = messages.toLowerCase().replace(/\s+/g, ' ');
  expect(
    acceptedParts.some((part) => normalized.includes(part)),
    `Expected resume validation message, received: ${messages}`
  ).toBe(true);
}

// ---------- Tests ----------

test('V01 - Candidate form rejects empty submission', async () => {
  await openCandidateForm();
  await submitButton().click();

  await expect(fieldErrors().first()).toBeVisible();
  const errors = await fieldErrors().allInnerTexts();
  expect(errors.length).toBeGreaterThan(0);
  expect(errors.some((text) => text.trim().toLowerCase() === 'required')).toBe(true);
});

test('V02 - Candidate form rejects invalid email format', async () => {
  await openCandidateForm();
  await page.locator('input[name="firstName"]').fill('Validation');
  await page.locator('input[name="lastName"]').fill('Candidate');
  await recruitment.input('Email').fill('not-an-email');
  await submitButton().click();

  const emailError = errorFor('Email');
  await expect(emailError).toBeVisible();
  await expect(emailError).not.toHaveText('');
});

test('V03 - Vacancy form requires mandatory fields', async () => {
  await recruitment.openVacancies();
  await addButton().click();
  await expect(recruitment.input('Vacancy Name')).toBeVisible();
  await submitButton().click();

  await expect(fieldErrors().first()).toBeVisible();
  await expect(errorFor('Vacancy Name')).toBeVisible();
  await expect(errorFor('Job Title')).toBeVisible();
  await expect(errorFor('Hiring Manager')).toBeVisible();
});

test('V04 - Candidate search with unknown name shows validation', async () => {
  const unknownName = `UnknownCandidate${randomInt(10000, 100000)}`;
  await recruitment.input('Candidate Name').fill(unknownName);
  await recruitment.searchButton.click();

  await expect(errorFor('Candidate Name')).toBeVisible();
});

test('V05 - Vacancy filters find the active vacancy', async () => {
  await createTestVacancy();
  await recruitment.openVacancies();
  await recruitment.selectDropdown('Vacancy', testVacancyName);
  await recruitment.selectDropdown('Status', 'Active');
  await recruitment.searchButton.click();

  const row = recruitment.rowContaining(testVacancyName).first();
  await expect(row).toBeVisible();
  await expect(row).toContainText('Active');
});

test('V06 - Interview form requires mandatory fields', async () => {
  await createTestVacancy();
  await createTestCandidate();
  await recruitment.shortlistCandidate();
  await page.locator("xpath=//button[normalize-space()='Schedule Interview']").click();
  await submitButton().click();

  await expect(errorFor('Interview Title')).toBeVisible();
  await expect(errorFor('Interviewer')).toBeVisible();
  await expect(errorFor('Date')).toBeVisible();
});

test('V07 - Candidate can be rejected from Application Initiated', async () => {
  await createTestVacancy();
  await createTestCandidate();
  await page.locator("xpath=//button[normalize-space()='Reject']").click();
  await expect(
    page.locator(
      "xpath=//*[self::h5 or self::h6][contains(normalize-space(),'Reject Candidate')]"
    ).first()
  ).toBeVisible();
  await submitButton().click();

  expect(await recruitment.hasStatus('Rejected')).toBe(true);
});

test('V08 - Candidate form rejects unsupported resume file type', async () => {
  await createTestVacancy();
  await openAndFillCandidateForm();
  const resume = join(tempDir, 'unsupported-resume.jpg');
  await writeFile(resume, 'Not a supported resume format');
  await recruitment.resumeInput.setInputFiles(resume);
  await submitButton().click();

  await assertResumeValidation('file', 'type', 'format', 'supported');
});

test('V09 - Candidate form rejects resume file over 1 MB', async () => {
  await createTestVacancy();
  await openAndFillCandidateForm();
  const resume = join(tempDir, 'oversized-resume.txt');
  await writeFile(resume, Buffer.alloc(1024 * 1024 + 1));
  await recruitment.resumeInput.setInputFiles(resume);
  await submitButton().click();

  await assertResumeValidation('1mb', '1 mb', 'size', 'large');
});
