import { expect } from '@playwright/test';

const BASE_URL = 'https://opensource-demo.orangehrmlive.com/web/index.php';
const RECRUITMENT_URL = `${BASE_URL}/recruitment/`;
const EMPLOYEE_LIST_URL = `${BASE_URL}/pim/viewEmployeeList`;

const normalize = (value) => (value ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
const lastWord = (name) => name.substring(name.lastIndexOf(' ') + 1);

/** Page actions for the Recruitment workflow (ported from RecruitmentPage.java). */
export class RecruitmentPage {

    constructor(page) {
        this.page = page;

        this.candidatesTab = page.locator("xpath=//a[normalize-space()='Candidates']");
        this.vacanciesTab = page.locator("xpath=//a[normalize-space()='Vacancies']");
        this.addButton = page.locator("xpath=//button[normalize-space()='Add']");
        this.saveButton = page.locator("button[type='submit']").first();
        this.searchButton = page.locator("xpath=//button[normalize-space()='Search']");
        this.autocompleteOptions = page.locator('.oxd-autocomplete-dropdown .oxd-autocomplete-option');
        this.tableRows = page.locator('.oxd-table-body .oxd-table-card');
        this.noRecords = page.getByText('No Records Found').first();
        this.deleteConfirmation = page.locator("xpath=//button[normalize-space()='Yes, Delete']");
        this.resumeInput = page.locator("input[type='file']");
        this.fieldErrors = page.locator('.oxd-input-field-error-message');
        this.body = page.locator('body');
    }

    // ---------- Navigation ----------

    async openRecruitment() {
        await this.page.goto(`${RECRUITMENT_URL}viewCandidates`);
        await expect(this.candidatesTab).toBeVisible();
    }

    async openCandidates() {
        await this.candidatesTab.click();
        await this.page.waitForURL(/viewCandidates/);
    }

    async openVacancies() {
        await this.vacanciesTab.click();
        await this.page.waitForURL(/viewJobVacancy/);
    }

    async openEmployeeList() {
        await this.page.goto(EMPLOYEE_LIST_URL);
        await expect(
            this.page.locator("xpath=//*[normalize-space()='Employee Information']").first()
        ).toBeVisible();
    }

    // ---------- Vacancy ----------

    async addVacancy(name, jobTitle, description, hiringManager, positions) {
        await this.addButton.click();
        await expect(this.input('Vacancy Name')).toBeVisible();

        await this.selectDropdown('Job Title', jobTitle);
        await this.input('Vacancy Name').fill(name);
        await this.textArea('Description').fill(description);
        await this.input('Hiring Manager').pressSequentially(hiringManager);
        await this.chooseThirdSuggestion();
        await this.input('Number of Positions').fill(positions);
        await this.saveButton.click();
        // After saving, OrangeHRM opens the new record at /addJobVacancy/<id>
        // or returns to the vacancy list.
        await this.page.waitForURL(/addJobVacancy\/\d+|viewJobVacancy/);
    }

    async searchVacancy(name) {
        await this.selectDropdown('Vacancy', name);
        await this.searchButton.click();
        await this.waitForRowOrEmptyState();
    }

    async isVacancyListed(name) {
        return this.isRowListed(name);
    }

    async isVacancyActive(name) {
        try {
            const text = await this.rowContaining(name).first().innerText();
            return text.split('\n').some((line) => line.trim().toLowerCase() === 'active');
        } catch {
            return false;
        }
    }

    async openVacancyForEdit(name) {
        const row = this.rowContaining(name).first();
        await row.locator("xpath=.//button[.//i[contains(@class,'bi-pencil')]]").click();
        await expect(this.input('Vacancy Name')).toBeVisible();
    }

    async deleteVacancy(name) {
        await this.openVacancies();
        await this.searchVacancy(name);
        const row = this.rowContaining(name).first();
        await row.locator("xpath=.//button[.//i[contains(@class,'bi-trash')]]").click();
        await this.deleteConfirmation.click();
        await expect(this.rowContaining(name)).toHaveCount(0);
    }

    // ---------- Form field readers ----------

    async getInputValue(label) {
        return this.input(label).inputValue();
    }

    async getTextAreaValue(label) {
        return this.textArea(label).inputValue();
    }

    async getDropdownValue(label) {
        return (await this.dropdown(label).innerText()).trim();
    }

    async cancelForm() {
        await this.page.locator("xpath=//button[normalize-space()='Cancel']").click();
    }

    // ---------- Candidate ----------

    async addCandidate(firstName, lastName, email, vacancy, resumePath) {
        await this.addButton.click();
        const firstNameInput = this.page.locator('input[name="firstName"]');
        await expect(firstNameInput).toBeVisible();
        await firstNameInput.fill(firstName);
        await this.page.locator('input[name="lastName"]').fill(lastName);
        await this.selectDropdown('Vacancy', vacancy);
        await this.input('Email').fill(email);
        await this.resumeInput.setInputFiles(resumePath);
        await this.saveButton.click();

        const initialStatus = this.page.getByText('Application Initiated').first();
        const candidateProfile = this.page.getByText('Candidate Profile', { exact: true }).first();
        try {
            await expect(
                initialStatus.or(candidateProfile).or(this.fieldErrors.first()).first()
            ).toBeVisible();
        } catch (error) {
            throw new Error(
                'After saving the candidate, neither the candidate profile nor validation '
                + `messages appeared. Current page text: ${await this.body.innerText()}`,
                { cause: error }
            );
        }

        const errors = (await this.fieldErrors.allInnerTexts()).filter((text) => text.trim());
        if (errors.length > 0) {
            throw new Error(`Candidate form was not saved: ${errors.join('; ')}`);
        }
    }

    async isCandidateApplicationDisplayed(name, vacancy) {
        const body = normalize(await this.body.innerText());
        return body.includes(normalize(name)) && body.includes(normalize(vacancy));
    }

    async searchCandidate(name) {
        await this.input('Candidate Name').fill(name);
        await this.chooseSuggestion(lastWord(name));
        await this.searchButton.click();
        await this.waitForRowOrEmptyState();
    }

    async isCandidateListed(name) {
        return this.isRowListed(lastWord(name));
    }

    async candidateHasListStatus(name, status) {
        try {
            const text = await this.rowContaining(lastWord(name)).first().innerText();
            return text.includes(status);
        } catch {
            return false;
        }
    }

    async downloadCandidateResume(name) {
        const row = this.rowContaining(lastWord(name)).first();
        await row.locator("xpath=.//button[.//i[contains(@class,'bi-download')]]").click();
    }

    async deleteCandidate(name) {
        await this.openCandidates();
        await this.searchCandidate(name);
        const row = this.rowContaining(lastWord(name)).first();
        await row.locator("xpath=.//button[.//i[contains(@class,'bi-trash')]]").click();
        await this.deleteConfirmation.click();
        await expect(this.rowContaining(lastWord(name))).toHaveCount(0);
    }

    // ---------- Hiring pipeline ----------

    /** Returns true if the page shows "Status: <status>", false if it does not within the timeout. */
    async hasStatus(status) {
        try {
            await expect(this.body).toContainText(`Status: ${status}`, { useInnerText: true });
            return true;
        } catch {
            return false;
        }
    }

    async shortlistCandidate() {
        await this.completeStatusAction('Shortlist', 'Shortlisted');
    }

    async scheduleInterview(title, interviewer, date, time) {
        await this.page.locator("xpath=//button[normalize-space()='Schedule Interview']").click();
        await this.input('Interview Title').fill(title);
        await this.input('Interviewer').pressSequentially(interviewer);
        await this.chooseThirdSuggestion();
        await this.input('Date').fill(date);
        if (time && time.trim() && (await this.input('Time').count()) > 0) {
            await this.input('Time').fill(time);
        }
        await this.saveButton.click();
        await expect(this.body).toContainText('Status: Interview Scheduled', { useInnerText: true });
    }

    async markInterviewPassed() {
        await this.completeStatusAction('Mark Interview Passed', 'Interview Passed');
    }

    async offerJob() {
        await this.completeStatusAction('Offer Job', 'Job Offered');
    }

    async hireCandidate() {
        await this.completeStatusAction('Hire', 'Hired');
    }

    async completeStatusAction(action, status) {
        await this.page.locator(`xpath=//button[normalize-space()='${action}']`).click();
        await expect(
            this.page.locator(
                `xpath=//*[self::h5 or self::h6][contains(normalize-space(), '${action}')]`
            ).first()
        ).toBeVisible();
        await this.saveButton.click();
        await expect(this.body).toContainText(`Status: ${status}`, { useInnerText: true });
    }

    // ---------- PIM check ----------

    async searchEmployee(name) {
        await this.input('Employee Name').fill(name);
        await this.chooseSuggestion(lastWord(name));
        await this.searchButton.click();
        await this.waitForRowOrEmptyState();
    }

    async isEmployeeListed(name) {
        return this.isRowListed(lastWord(name));
    }

    // ---------- Utilities ----------

    async isSuccessMessageDisplayed() {
        try {
            const toast = this.page.locator('.oxd-toast').first();
            await expect(toast).toBeVisible();
            return (await toast.innerText()).toLowerCase().includes('success');
        } catch {
            return false;
        }
    }

    async logout() {
        await this.page.locator('.oxd-userdropdown-tab').click();
        await this.page.locator("xpath=//a[normalize-space()='Logout']").click();
        await expect(this.page.locator('input[name="username"]')).toBeVisible();
    }

    async selectDropdown(label, value) {
        await this.dropdown(label).click();
        await this.page.locator(
            "xpath=//div[contains(@class,'oxd-select-dropdown')]"
            + `//*[self::span or self::div][normalize-space()='${value}']`
        ).first().click();
    }

    /**
     * Picks the third autocomplete suggestion. The shared demo site can return fewer than
     * three matches, so the last suggestion is used in that case.
     */
    async chooseThirdSuggestion() {
        await expect.poll(async () => {
            const texts = await this.autocompleteOptions.allInnerTexts();
            return texts.length > 0 && !texts.some((text) => /searching/i.test(text));
        }).toBe(true);
        // Let the list settle, then click; click() re-resolves the locator if it refreshes.
        const count = await this.autocompleteOptions.count();
        await this.autocompleteOptions.nth(Math.min(2, count - 1)).click();
    }

    async chooseSuggestion(expectedText) {
        const option = this.autocompleteOptions.filter({ hasText: expectedText }).first();
        await expect(option).toBeVisible();
        await option.click();
    }

    // ---------- Locator builders ----------

    input(label) {
        return this.page.locator(
            `xpath=//label[normalize-space()='${label}']`
            + "/ancestor::div[contains(@class,'oxd-input-group')]//input"
        ).first();
    }

    textArea(label) {
        return this.page.locator(
            `xpath=//label[normalize-space()='${label}']`
            + "/ancestor::div[contains(@class,'oxd-input-group')]//textarea"
        ).first();
    }

    dropdown(label) {
        return this.page.locator(
            `xpath=//label[normalize-space()='${label}']`
            + "/ancestor::div[contains(@class,'oxd-input-group')]"
            + "//div[contains(@class,'oxd-select-text-input')]"
        ).first();
    }

    rowContaining(text) {
        return this.page.locator(
            `xpath=//div[contains(@class,'oxd-table-card')][contains(.,'${text}')]`
        );
    }

    // ---------- Internal helpers ----------

    async isRowListed(text) {
        try {
            await this.waitForRowOrEmptyState();
        } catch {
            return false;
        }
        const rowTexts = await this.tableRows.allInnerTexts();
        return rowTexts.some((rowText) => normalize(rowText).includes(normalize(text)));
    }

    async waitForRowOrEmptyState() {
        await expect(this.tableRows.first().or(this.noRecords)).toBeVisible();
    }
}
