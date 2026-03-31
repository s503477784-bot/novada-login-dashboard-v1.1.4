/**
 * =============================================================================
 * Novada Auth System - Captcha Widget Component
 * =============================================================================
 * Math-based captcha with canvas rendering
 *
 * SECURITY NOTE:
 * The captcha answer is verified server-side. Client-side verification
 * is for UX only — real security comes from backend validation.
 */

const CaptchaWidget = {
    /**
     * Default state (will be overridden per-instance in init)
     */
    state: {
        token: null,
        answer: 0,
        isVerified: false,
        serverAvailable: true,
    },

    /**
     * Initialize the captcha widget
     */
    init(config) {
        const {
            canvasId,
            inputId,
            checkBtnId,
            wrapperId,
            errorId,
            msgId,
            useServerCaptcha = false,
        } = config;

        // Create OWN state — prevents prototype sharing across instances
        this.state = {
            token: null,
            answer: 0,
            isVerified: false,
            serverAvailable: true,
        };

        this.elements = {
            canvas: DOM.$(canvasId),
            input: DOM.$(inputId),
            checkBtn: DOM.$(checkBtnId),
            wrapper: DOM.$(wrapperId),
            errorEl: DOM.$(errorId),
            msgEl: DOM.$(msgId),
        };

        this.useServerCaptcha = useServerCaptcha;

        if (!this.elements.canvas || !this.elements.input || !this.elements.checkBtn) {
            console.error('[CaptchaWidget] Required elements not found');
            return;
        }

        // Draw initial captcha
        this.refresh();

        // Event listeners
        DOM.on(this.elements.canvas, 'click', () => this.refresh());
        DOM.on(this.elements.input, 'input', () => this.clearError());
        DOM.on(this.elements.checkBtn, 'click', async (e) => {
            e.preventDefault();
            await this.verify();
        });

        DOM.on(this.elements.input, 'keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                await this.verify();
            }
        });

        return this;
    },

    /**
     * Refresh / regenerate captcha
     */
    async refresh() {
        this.state.isVerified = false;
        this.state.token = null;
        this.state.serverAvailable = true;

        if (this.elements.checkBtn) {
            this.elements.checkBtn.className = 'check-btn-circle';
        }
        if (this.elements.msgEl) {
            this.elements.msgEl.style.opacity = '0';
        }
        if (this.elements.input) {
            this.elements.input.value = '';
        }
        this.clearError();

        if (this.useServerCaptcha) {
            await this.loadServerCaptcha();
        } else {
            this.generateLocalCaptcha();
        }
    },

    /**
     * Load captcha from server
     */
    async loadServerCaptcha() {
        try {
            const result = await AuthAPI.getCaptcha();

            if (result.success && result.data?.token && result.data?.question) {
                this.state.serverAvailable = true;
                this.state.token = result.data.token;
                this.drawQuestion(result.data.question);
                return;
            }

            this.handleServerUnavailable();
        } catch (error) {
            console.warn('[CaptchaWidget] Server captcha failed:', error);
            this.handleServerUnavailable();
        }
    },

    /**
     * Handle server captcha unavailable — show error, block verify
     */
    handleServerUnavailable() {
        this.state.serverAvailable = false;
        this.state.token = null;
        this.drawQuestion('Retry');
        this.showValidationError('Security check is temporarily unavailable. Please refresh and try again.');
    },

    /**
     * Generate local captcha (for offline / testing)
     */
    generateLocalCaptcha() {
        const operators = ['+', '-', '×'];
        const operator = operators[Math.floor(Math.random() * operators.length)];

        let num1 = Math.floor(Math.random() * 15) + 1;
        let num2 = Math.floor(Math.random() * 9) + 1;

        if (operator === '-' && num1 < num2) {
            [num1, num2] = [num2, num1];
        }

        switch (operator) {
            case '+': this.state.answer = num1 + num2; break;
            case '-': this.state.answer = num1 - num2; break;
            case '×': this.state.answer = num1 * num2; break;
            default:  this.state.answer = 0; break;
        }

        this.drawQuestion(`${num1} ${operator} ${num2}`);
    },

    /**
     * Draw captcha question on canvas
     */
    drawQuestion(question) {
        const canvas = this.elements.canvas;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        ctx.fillStyle = '#F2F2F7';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Noise dots
        for (let i = 0; i < 80; i++) {
            ctx.fillStyle = this.getRandomColor();
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Noise lines
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.strokeStyle = `rgba(${Math.random()*100},${Math.random()*100},${Math.random()*100},0.15)`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Bezier curves
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.bezierCurveTo(
                Math.random() * canvas.width, Math.random() * canvas.height,
                Math.random() * canvas.width, Math.random() * canvas.height,
                Math.random() * canvas.width, Math.random() * canvas.height,
            );
            ctx.strokeStyle = `rgba(${Math.random()*100},${Math.random()*100},${Math.random()*100},0.15)`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Question text
        ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, Arial';
        ctx.fillStyle = '#1D1D1F';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((Math.random() - 0.5) * 0.15);
        ctx.fillText(question, 0, 0);
        ctx.restore();
    },

    getRandomColor() {
        return `rgb(${Math.floor(Math.random()*200)},${Math.floor(Math.random()*200)},${Math.floor(Math.random()*200)})`;
    },

    /**
     * Verify captcha answer
     * For server captcha: performs a server-side pre-verification so the user
     * gets immediate feedback before form submission.
     */
    async verify() {
        // Guard against re-entry during wrong-answer cooldown
        if (this._verifying) return false;

        const userInput = this.elements.input?.value;
        if (!userInput) {
            this.elements.input?.focus();
            return false;
        }

        const userAnswer = parseInt(userInput, 10);

        if (this.useServerCaptcha) {
            if (!this.state.serverAvailable || !this.state.token) {
                this.showValidationError('Unable to prepare the security check. Please refresh the captcha.');
                return false;
            }

            if (Number.isNaN(userAnswer)) {
                this.showValidationError('Please enter a valid number.');
                this.showError('Invalid');
                return false;
            }

            // Pre-verify against the server so user gets real-time feedback.
            // The form submit will still do authoritative verification.
            this._verifying = true;
            try {
                const result = await AuthAPI.verifyCaptchaPreCheck(this.state.token, userAnswer);

                if (result.success && result.data?.valid) {
                    this._verifying = false;
                    this.showSuccess('Verified');
                    return true;
                }

                // Answer was wrong — server consumed the old token and issued a new one
                this.showError('Wrong');
                this.showValidationError(result.data?.message || 'Incorrect answer. Please try again.');

                // If server returned a new captcha, load it directly instead of a full refresh
                if (result.data?.newCaptcha) {
                    setTimeout(() => {
                        this.state.token = result.data.newCaptcha.token;
                        this.state.isVerified = false;
                        this.drawQuestion(result.data.newCaptcha.question);
                        if (this.elements.input) this.elements.input.value = '';
                        if (this.elements.checkBtn) this.elements.checkBtn.className = 'check-btn-circle';
                        if (this.elements.msgEl) this.elements.msgEl.style.opacity = '0';
                        this.clearError();
                        this._verifying = false;
                    }, 1200);
                } else {
                    setTimeout(() => {
                        this.refresh();
                        this._verifying = false;
                    }, 1200);
                }
                return false;
            } catch (error) {
                this._verifying = false;
                // If pre-check endpoint is unavailable, block submission (fail-closed)
                console.warn('[CaptchaWidget] Pre-check unavailable, blocking submission');
                this.showError('Error');
                this.showValidationError('Security check is temporarily unavailable. Please refresh and try again. [REF: CAPTCHA-SVC]');
                return false;
            }
        }

        // Local captcha mode
        const isCorrect = userAnswer === this.state.answer;
        if (isCorrect) {
            this.showSuccess('Verified');
            return true;
        }

        this._verifying = true;
        this.showError('Error');
        setTimeout(() => {
            this.refresh();
            this._verifying = false;
        }, 1200);
        return false;
    },

    showSuccess(label = 'Verified') {
        this.state.isVerified = true;
        if (this.elements.checkBtn) this.elements.checkBtn.className = 'check-btn-circle is-success';
        if (this.elements.msgEl) {
            this.elements.msgEl.textContent = label;
            this.elements.msgEl.style.color = '#f84eea';
            this.elements.msgEl.style.opacity = '1';
        }
        this.clearError();
    },

    showError(label = 'Error') {
        this.state.isVerified = false;
        if (this.elements.checkBtn) this.elements.checkBtn.className = 'check-btn-circle is-error';
        if (this.elements.msgEl) {
            this.elements.msgEl.textContent = label;
            this.elements.msgEl.style.color = '#FF3B30';
            this.elements.msgEl.style.opacity = '1';
        }
    },

    showValidationError(message) {
        if (this.elements.wrapper) this.elements.wrapper.classList.add('is-error');
        if (this.elements.errorEl) {
            this.elements.errorEl.textContent = message;
            this.elements.errorEl.style.display = 'block';
        }
    },

    clearError() {
        if (this.elements.wrapper) this.elements.wrapper.classList.remove('is-error');
        if (this.elements.errorEl) this.elements.errorEl.style.display = 'none';
    },

    isVerified() {
        if (this.useServerCaptcha) {
            return this.state.serverAvailable && Boolean(this.state.token) && this.state.isVerified;
        }

        return this.state.isVerified;
    },

    getData() {
        const parsedAnswer = parseInt(this.elements.input?.value, 10);
        return {
            captchaToken: this.state.token,
            captchaAnswer: Number.isNaN(parsedAnswer) ? null : parsedAnswer,
        };
    },
};
