/**
 * =============================================================================
 * Novada Auth System - Register Page Logic
 * =============================================================================
 */

(function() {
    'use strict';

    const RegisterPage = {
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
                inputId: 'inputEmail',
                errorId: 'errorEmail',
                validationType: 'email',
            });

            // Initialize password input with strength indicator
            this.components.password = PasswordInput.init({
                inputId: 'inputPwd',
                errorId: 'errorPwd',
                showStrength: true,
                onInput: (value) => this.onPasswordChange(value),
            });

            // Initialize confirm password input
            this.components.confirmPassword = PasswordInput.initConfirmation({
                passwordInputId: 'inputPwd',
                confirmInputId: 'inputConfirmPwd',
                errorId: 'errorConfirmPwd',
                matchIndicatorId: 'passwordMatchIndicator',
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
                onClick: () => this.handleGoogleSignup(),
                onError: (error) => {
                    console.error('Google signup error:', error);
                    DOM.showPageError('pageError', 'pageErrorText', ErrorMessages.get('NOT_IMPLEMENTED'));
                },
            });

            // Setup form submission
            const form = DOM.$('regForm');
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

        onPasswordChange(value) {
            const confirmInput = DOM.$('inputConfirmPwd');
            if (confirmInput?.value) {
                confirmInput.dispatchEvent(new Event('input'));
            }
        },

        async handleSubmit(e) {
            e.preventDefault();

            const isValid = this.validateForm();
            if (!isValid) return;

            const email = DOM.$('inputEmail')?.value?.trim();
            const password = DOM.$('inputPwd')?.value;
            const confirmPassword = DOM.$('inputConfirmPwd')?.value;
            const captchaData = this.components.captcha.getData();

            try {
                DOM.clearPageError('pageError');
                DOM.setLoading(true, DOM.qs('.auth-card'));

                const result = await AuthAPI.register({
                    email,
                    password,
                    confirmPassword,
                    ...captchaData,
                });

                if (result.success) {
                    SuccessAnimation.show({
                        formWrapper: DOM.$('formContent'),
                        successWrapper: DOM.$('successContent'),
                        title: 'Success!',
                        subtitle: 'Your account has been created successfully.',
                        redirectUrl: '/auth/login.html',
                        redirectDelay: 3,
                    });
                } else {
                    throw new Error(result.message || 'Registration failed');
                }

            } catch (error) {
                console.error('Registration error:', error);

                if (error.code === 'EMAIL_EXISTS') {
                    DOM.showFieldError('inputEmail', 'errorEmail', ErrorMessages.getText('EMAIL_EXISTS'));
                    DOM.showPageError('pageError', 'pageErrorText', ErrorMessages.get('EMAIL_EXISTS'));
                } else if (error.code === 'CAPTCHA_INVALID') {
                    this.components.captcha.showValidationError(ErrorMessages.get('CAPTCHA_INVALID'));
                    this.components.captcha.refresh();
                } else if (error.code === 'RATE_LIMIT_REGISTER') {
                    DOM.showPageError('pageError', 'pageErrorText', ErrorMessages.get('RATE_LIMIT_REGISTER'));
                } else if (error.code === 'VALIDATION_ERROR') {
                    DOM.showPageError('pageError', 'pageErrorText', ErrorMessages.get('VALIDATION_ERROR'));
                } else if (error.code === 'UID_GENERATION_FAILED') {
                    DOM.showPageError('pageError', 'pageErrorText', ErrorMessages.get('UID_GENERATION_FAILED'));
                } else if (error.code === 'CSRF_REJECTED') {
                    DOM.showPageError('pageError', 'pageErrorText', ErrorMessages.get('CSRF_REJECTED'));
                } else if (error.code === 'SERVER_ERROR') {
                    DOM.showPageError('pageError', 'pageErrorText', ErrorMessages.get('SERVER_ERROR'));
                } else if (error.errors && Array.isArray(error.errors)) {
                    // Display per-field validation errors from server
                    const errorIdMap = {
                        email: 'errorEmail',
                        password: 'errorPwd',
                        confirmPassword: 'errorConfirmPwd',
                    };
                    const inputIdMap = {
                        email: 'inputEmail',
                        password: 'inputPwd',
                        confirmPassword: 'inputConfirmPwd',
                    };
                    error.errors.forEach((err) => {
                        if (errorIdMap[err.field]) {
                            DOM.showFieldError(inputIdMap[err.field], errorIdMap[err.field], err.message);
                        }
                    });
                } else if (error.code) {
                    DOM.showPageError('pageError', 'pageErrorText', ErrorMessages.get(error.code, error.message || 'Registration failed. Please try again.'));
                } else {
                    DOM.showPageError('pageError', 'pageErrorText', ErrorMessages.get('NETWORK_ERROR', error.message || 'Registration failed. Please try again.'));
                }

            } finally {
                DOM.setLoading(false, DOM.qs('.auth-card'));
            }
        },

        validateForm() {
            let isValid = true;

            const emailInput = DOM.$('inputEmail');
            const emailResult = Validation.email(emailInput?.value);
            if (!emailResult.valid) {
                DOM.showFieldError('inputEmail', 'errorEmail', emailResult.message);
                isValid = false;
            }

            const pwdInput = DOM.$('inputPwd');
            const pwdResult = Validation.password(pwdInput?.value);
            if (!pwdResult.valid) {
                DOM.showFieldError('inputPwd', 'errorPwd', pwdResult.message);
                isValid = false;
            }

            const confirmPwdInput = DOM.$('inputConfirmPwd');
            const matchResult = Validation.passwordMatch(pwdInput?.value, confirmPwdInput?.value);
            if (!matchResult.valid) {
                DOM.showFieldError('inputConfirmPwd', 'errorConfirmPwd', matchResult.message);
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

        async handleGoogleSignup() {
            DOM.showPageError('pageError', 'pageErrorText', ErrorMessages.get('NOT_IMPLEMENTED'));
        },
    };

    RegisterPage.init();
    window.RegisterPage = RegisterPage;

})();
