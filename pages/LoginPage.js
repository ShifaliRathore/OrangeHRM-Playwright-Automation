export class LoginPage {

    constructor(page) {
        this.page = page;
        this.username = 'input[name="username"]';
        this.password = 'input[name="password"]';
        this.loginBtn = 'button[type="submit"]';
        this.errorMsg = '.oxd-alert-content-text';
    }

    async navigate() {
        await this.page.goto(
            'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login'
        );
    }
    async login(username, password) {
        await this.page.fill(this.username, username);
        await this.page.fill(this.password, password);
        await this.page.click(this.loginBtn);
    }
    
}