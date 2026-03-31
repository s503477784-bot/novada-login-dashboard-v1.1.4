/**
 * =============================================================================
 * Novada Auth System - Password Input Component
 * =============================================================================
 * Password input with show/hide toggle and strength indicator
 */

const PasswordInput = {
    /**
     * Icon SVG paths
     */
    icons: {
        eyeOpen: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>`,
        eyeClosed: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>`,
    },
    
    /**
     * Initialize a password input with toggle visibility
     * @param {Object} config - Configuration object
     * @param {string} config.inputId - Password input element ID
     * @param {string} config.errorId - Error message element ID
     * @param {string} config.wrapperId - Wrapper element ID (optional)
     * @param {boolean} config.showStrength - Show password strength indicator
     * @param {Function} config.onInput - Callback on input change
     */
    init(config) {
        const { inputId, errorId, wrapperId, showStrength = false, onInput } = config;
        
        const input = DOM.$(inputId);
        if (!input) return;
        
        // Get or create wrapper
        let wrapper = wrapperId ? DOM.$(wrapperId) : input.parentElement;
        
        // If input is not already wrapped, wrap it
        if (!wrapper.classList.contains('password-input-wrapper')) {
            const newWrapper = DOM.create('div', { className: 'password-input-wrapper' });
            input.parentNode.insertBefore(newWrapper, input);
            newWrapper.appendChild(input);
            wrapper = newWrapper;
        }
        
        // Create toggle button if it doesn't exist
        let toggleBtn = wrapper.querySelector('.password-toggle-btn');
        if (!toggleBtn) {
            toggleBtn = DOM.create('button', {
                type: 'button',
                className: 'password-toggle-btn',
                'aria-label': 'Toggle password visibility',
            });
            toggleBtn.innerHTML = this.icons.eyeClosed;
            wrapper.appendChild(toggleBtn);
        }
        
        // Track visibility state
        let isVisible = false;
        
        // Toggle visibility handler
        DOM.on(toggleBtn, 'click', (e) => {
            e.preventDefault();
            isVisible = !isVisible;
            
            input.type = isVisible ? 'text' : 'password';
            toggleBtn.innerHTML = isVisible ? this.icons.eyeOpen : this.icons.eyeClosed;
            toggleBtn.setAttribute('aria-label', isVisible ? 'Hide password' : 'Show password');
        });
        
        // Clear error on input
        DOM.on(input, 'input', () => {
            DOM.clearFieldError(inputId, errorId);
            
            if (onInput) {
                onInput(input.value);
            }
            
            // Update strength indicator if enabled
            if (showStrength) {
                this.updateStrengthIndicator(wrapper, input.value);
            }
        });
        
        // Create strength indicator if needed
        if (showStrength) {
            this.createStrengthIndicator(wrapper);
        }
        
        return {
            getValue: () => input.value,
            setValue: (value) => { input.value = value; },
            validate: () => Validation.password(input.value),
            showError: (message) => DOM.showFieldError(inputId, errorId, message),
            clearError: () => DOM.clearFieldError(inputId, errorId),
            focus: () => input.focus(),
            toggleVisibility: () => toggleBtn.click(),
            isVisible: () => isVisible,
        };
    },
    
    /**
     * Create password strength indicator
     * @param {HTMLElement} wrapper - Password input wrapper
     */
    createStrengthIndicator(wrapper) {
        if (wrapper.querySelector('.password-strength')) return;
        
        const indicator = DOM.create('div', { className: 'password-strength' }, [
            DOM.create('div', { className: 'password-strength-bar' }, [
                DOM.create('div', { className: 'password-strength-fill' }),
            ]),
            DOM.create('span', { className: 'password-strength-text' }),
        ]);
        
        wrapper.parentNode.insertBefore(indicator, wrapper.nextSibling);
    },
    
    /**
     * Update strength indicator display
     * @param {HTMLElement} wrapper - Password input wrapper
     * @param {string} password - Current password value
     */
    updateStrengthIndicator(wrapper, password) {
        const indicator = wrapper.parentNode.querySelector('.password-strength');
        if (!indicator) return;
        
        const fill = indicator.querySelector('.password-strength-fill');
        const text = indicator.querySelector('.password-strength-text');
        
        if (!password) {
            indicator.classList.remove('visible');
            return;
        }
        
        indicator.classList.add('visible');
        
        const strength = Validation.calculatePasswordStrength(password);
        
        fill.classList.remove('weak', 'medium', 'strong');
        fill.classList.add(strength);
        
        const strengthLabels = {
            weak: 'Weak password',
            medium: 'Good password',
            strong: 'Strong password',
        };
        text.textContent = strengthLabels[strength] || '';
    },
    
    /**
     * Initialize password confirmation with match indicator
     * @param {Object} config - Configuration object
     * @param {string} config.passwordInputId - Original password input ID
     * @param {string} config.confirmInputId - Confirm password input ID
     * @param {string} config.errorId - Error message element ID
     * @param {string} config.matchIndicatorId - Match indicator element ID (optional)
     */
    initConfirmation(config) {
        const { passwordInputId, confirmInputId, errorId, matchIndicatorId } = config;
        
        const passwordInput = DOM.$(passwordInputId);
        const confirmInput = DOM.$(confirmInputId);
        if (!passwordInput || !confirmInput) return;
        
        // Initialize confirm input with visibility toggle
        const confirmComponent = this.init({
            inputId: confirmInputId,
            errorId: errorId,
        });
        
        // Create match indicator if ID provided and element doesn't exist
        let matchIndicator = matchIndicatorId ? DOM.$(matchIndicatorId) : null;
        if (!matchIndicator && matchIndicatorId) {
            matchIndicator = DOM.create('div', {
                id: matchIndicatorId,
                className: 'password-match-indicator',
            });
            confirmInput.parentNode.parentNode.appendChild(matchIndicator);
        }
        
        // Update match indicator on confirm input change
        const updateMatchIndicator = () => {
            if (!matchIndicator) return;
            
            const password = passwordInput.value;
            const confirm = confirmInput.value;
            
            if (!confirm) {
                matchIndicator.classList.remove('visible', 'match', 'no-match');
                return;
            }
            
            matchIndicator.classList.add('visible');
            
            if (password === confirm) {
                matchIndicator.classList.remove('no-match');
                matchIndicator.classList.add('match');
                matchIndicator.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    <span>Passwords match</span>
                `;
            } else {
                matchIndicator.classList.remove('match');
                matchIndicator.classList.add('no-match');
                matchIndicator.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                    <span>Passwords do not match</span>
                `;
            }
        };
        
        DOM.on(confirmInput, 'input', updateMatchIndicator);
        DOM.on(passwordInput, 'input', updateMatchIndicator);
        
        return {
            ...confirmComponent,
            validateMatch: () => Validation.passwordMatch(passwordInput.value, confirmInput.value),
        };
    },
};

// Export for use in other modules
window.PasswordInput = PasswordInput;
