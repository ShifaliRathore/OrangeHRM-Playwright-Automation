import { test, expect } from '@playwright/test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LoginPage } from '../pages/LoginPage.js';
import { RecruitmentPage } from '../pages/RecruitmentPage.js';

// Tests depend on each other, so run them in order in one shared browser session.
test.describe.configure({ mode: 'serial', timeout: 120000 });

const cleanupRecruitmentData = process.env.CLEANUP_RECRUITMENT_DATA === 'true';

const randomNumber = 10 + Math.floor(Math.random() * 90);
const uniqueId = Date.now().toString();
const vacancyName = `Tester ${randomNumber}`;
const candidateFirstName = 'Automation';
const candidateLastName = `Candidate${randomNumber}`;
const candidateName = `${candidateFirstName} ${candidateLastName}`;
const email = `candidate${uniqueId}@example.com`;
const interviewTitle = `Automation Testing ${uniqueId}`;

// OrangeHRM demo date format is yyyy-dd-mm (same as the original Java test).
const today = new Date();
const pad = (n) => String(n).padStart(2, '0');
const interviewDate = `${today.getFullYear()}-${pad(today.getDate())}-${pad(today.getMonth() + 1)}`;

let context;
let page;
let recruitment;
let tempDir;
let resumePath;
let vacancyCreated = false;
let vacancyDeleted = false;
let candidateCreated = false;

test.beforeAll(async ({ browser }) => {
  test.setTimeout(120000);

  context = await browser.newContext();
  page = await context.newPage();
  recruitment = new RecruitmentPage(page);

  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login('Admin', 'admin123');
  await expect(page.locator("xpath=//h6[normalize-space()='Dashboard']")).toBeVisible();
});

test.afterAll(async () => {
  test.setTimeout(120000);

  if (cleanupRecruitmentData) {
    try {
      if (candidateCreated) {
        await recruitment.openRecruitment();
        await recruitment.deleteCandidate(candidateName);
      }
    } catch (error) {
      console.error(`Candidate cleanup did not complete: ${error.message}`);
    }
    try {
      if (vacancyCreated && !vacancyDeleted) {
        await recruitment.deleteVacancy(vacancyName);
      }
    } catch (error) {
      console.error(`Vacancy cleanup did not complete: ${error.message}`);
    }
  }

  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
  }
  await context.close();
});

test('TC01 - Create and verify the unique QA vacancy', async () => {
  await recruitment.openRecruitment();
  await recruitment.openVacancies();
  vacancyCreated = true;
  await recruitment.addVacancy(
    vacancyName, 'QA Engineer', 'Expert in Selenium Webdriver', 'a', '2'
  );
  await recruitment.openCandidates();
  await recruitment.openVacancies();
  await recruitment.searchVacancy(vacancyName);

  expect(await recruitment.isVacancyListed(vacancyName)).toBe(true);
  expect(await recruitment.isVacancyActive(vacancyName)).toBe(true);
});

test('TC02 - Add a candidate and verify the initial application', async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'orangehrm-candidate-'));
  resumePath = join(tempDir, 'resume.txt');
  await writeFile(resumePath, 'Automation test candidate resume\nSample QA experience.\n');

  await recruitment.openCandidates();
  candidateCreated = true; // Let afterAll clean up even if the save wait fails.
  await recruitment.addCandidate(
    candidateFirstName, candidateLastName, email, vacancyName, resumePath
  );

  expect(await recruitment.isCandidateApplicationDisplayed(candidateName, vacancyName)).toBe(true);
  expect(await recruitment.hasStatus('Application Initiated')).toBe(true);
});

test('TC03 - Shortlist the candidate', async () => {
  await recruitment.shortlistCandidate();
  expect(await recruitment.hasStatus('Shortlisted')).toBe(true);
});

test('TC04 - Schedule the candidate interview', async () => {
  await recruitment.scheduleInterview(interviewTitle, 'a', interviewDate, '01:00 PM');
  expect(await recruitment.hasStatus('Interview Scheduled')).toBe(true);
});

test('TC05 - Mark the interview as passed', async () => {
  await recruitment.markInterviewPassed();
  expect(await recruitment.hasStatus('Interview Passed')).toBe(true);
});

test('TC06 - Offer the candidate the job', async () => {
  await recruitment.offerJob();
  expect(await recruitment.hasStatus('Job Offered')).toBe(true);
});

test('TC07 - Hire the candidate', async () => {
  await recruitment.hireCandidate();
  expect(await recruitment.hasStatus('Hired')).toBe(true);
});

test('TC08 - Verify the hired employee in PIM', async () => {
  await recruitment.openEmployeeList();
  await recruitment.searchEmployee(candidateName);
  expect(await recruitment.isEmployeeListed(candidateName)).toBe(true);
});

test('TC09 - Delete the test vacancy', async () => {
  await recruitment.openRecruitment();
  await recruitment.deleteVacancy(vacancyName);
  vacancyDeleted = true;
});
