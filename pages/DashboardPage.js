export class DashboardPage {

    constructor(page) {
        this.page = page;
        this.dashboardText = 'h6';
    }

    async isDashboardVisible() {
        return await this.page.locator(this.dashboardText)
                              .isVisible();
    }
}