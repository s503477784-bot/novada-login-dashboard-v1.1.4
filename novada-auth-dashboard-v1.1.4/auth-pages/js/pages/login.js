/**
 * =============================================================================
 * Novada Auth System - Login Page Logic
 * =============================================================================
 */

(function() {
    'use strict';

    const LoginPage = {
        components: {},

        init() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        },

        setup() {
            // Initialize email input
            this.components.email = FormInput.init({
                inputId: 'loginEmail',
                errorId: 'errorEmail',
                validationType: 'email',
            });

            // Initialize password input with visibility toggle
            this.components.password = PasswordInput.init({
                inputId: 'loginPwd',
                errorId: 'errorPwd',
            });

            // Initialize captcha widget (server-side)
            this.components.captcha = Object.create(CaptchaWidget);
            this.components.captcha.init({
                canvasId: 'mathCanvas',
                inputId: 'captchaInput',
                checkBtnId: 'checkBtn',
                wrapperId: 'captchaWrapper',
                errorId: 'errorCaptcha',
                msgId: 'captchaMsg',
                useServerCaptcha: true,
            });

            // Initialize Google button
            this.components.googleBtn = GoogleButton.init({
                buttonId: 'googleBtn',
                onClick: () => this.handleGoogleLogin(),
                onError: (error) => {
                    console.error('Google login error:', error);
                    DOM.showPageError('pageError', 'pageErrorText', ErrorMessages.get('NOT_IMPLEMENTED'));
                },
            });

            // Setup form submission
            const form = DOM.$('loginForm');
            if (form) {
                DOM.on(form, 'submit', (e) => this.handleSubmit(e));
            }

            // Redirect if already authenticated
            this.redirectIfAuthenticated();
        },

        async redirectIfAuthenticated() {
            const hasSession = await AuthAPI.hasValidSession();
            if (hasSession) {
                window.location.href = '/app/';
            }
        },

        async handleSubmit(e) {
            e.preventDefault();

            const isValid = this.validateForm();
            if (!isValid) return;

            const email = DOM.$('loginEmail')?.value?.trim();
            const password = DOM.$('loginPwd')?.value;
            const rememberMe = DOM.$('rememberMe')?.checked || DOM.qs('.toggle-input')?.checked || false;
            const captchaData = this.components.captcha.getData();

            try {
                DOM.clearPageError('pageError');
                DOM.setLoading(true, DOM.qs('.auth-card'));

                const result = await AuthAPI.login({
                    email,
                    password,
                    rememberMe,
                    ...captchaData,
                });

                if (result.success) {
                    SuccessAnimation.show({
                        formWrapper: DOM.$('formContent'),
                        successWrapper: DOM.$('successContent'),
                        title: 'Welcome Back!',
                        subtitle: 'Logging you in securely...',
                        redirectUrl: '/app/',
                        redirectDelay: 2,
                    });
                } else {
                    throw new Error(result.message || 'Login failed');
                }

            } catch (error) {
                console.error('Login error:', error);

                if (error.code === 'INVALID_CREDENTIALS') {
                    DOM.showFieldError('loginEmail', 'errorEmail', ErrorMessages.getText('INVALID_CREDENTIALS'));
                    DOM.showFieldError('loginPwd', 'errorPwd', '');
                    DOM.showPageError('pageError', 'pageErrorText', ErrorMessages.get('INVALID_CREDENTIALS'));
                } else if (error.code === 'CAPTCHA_INVALID') {
                    this.components.captcha.showValidationError(ErrorMessages.get('CAPTCHA_INVALID'));
                    this.components.captcha.refresh();
                } else if (error.code === 'RATE_LIMIT_AUTH') {
                    DOM.showPageError('pageError', 'pageErrorText', ErrorMessages.get('RATE_LIMIT_AUTH'));
                } else if (error.code === 'ACCOUNT_DISABLED') {
                    DOM.showPageError('pageError', 'pageErrorText', ErrorMessages.get('ACCOUNT_DISABLED'));
                } else if (error.code === 'CSRF_REJECTED') {
                    DOM.showPageError('pageError', 'pageErrorText', ErrorMessages.get('CSRF_REJECTED'));
                } else if (error.code === 'INVALID_TOKEN' || error.code === 'NO_TOKEN') {
                    DOM.showPageError('pageError', 'pageErrorText', ErrorMessages.get(error.code));
                } else if (error.code === 'SERVER_ERROR') {
                    DOM.showPageError('pageError', 'pageErrorText', ErrorMessages.get('SERVER_ERROR'));
                } else if (error.code) {
                    DOM.showPageError('pageError', 'pageErrorText', ErrorMessages.get(error.code, error.message || 'Login failed. Please try again.'));
                } else {
                    DOM.showPageError('pageError', 'pageErrorText', ErrorMessages.get('NETWORK_ERROR', error.message || 'Login failed. Please try again.'));
                }

            } finally {
                DOM.setLoading(false, DOM.qs('.auth-card'));
            }
        },

        validateForm() {
            let isValid = true;

            const emailInput = DOM.$('loginEmail');
            const emailResult = Validation.email(emailInput?.value);
            if (!emailResult.valid) {
                DOM.showFieldError('loginEmail', 'errorEmail', emailResult.message);
                isValid = false;
            }

            const pwdInput = DOM.$('loginPwd');
            if (!pwdInput?.value) {
                DOM.showFieldError('loginPwd', 'errorPwd', 'Please enter your password.');
                isValid = false;
            }

            if (isValid && !this.components.captcha.isVerified()) {
                const captchaInput = DOM.$('captchaInput');
                if (!captchaInput?.value) {
                    this.components.captcha.showValidationError('Please solve the math problem above.');
                    captchaInput?.focus();
                } else {
                    this.components.captcha.showValidationError('Please click the ✓ button to verify your answer.');
                }
                isValid = false;
            }

            return isValid;
        },

        async handleGoogleLogin() {
            DOM.showPageError('pageError', 'pageErrorText', ErrorMessages.get('NOT_IMPLEMENTED'));
        },
    };

    LoginPage.init();
    window.LoginPage = LoginPage;

})();
