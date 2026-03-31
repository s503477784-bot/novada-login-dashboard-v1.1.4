/**
 * =============================================================================
 * Novada Auth System - Form Input Component
 * =============================================================================
 * Reusable form input component with validation support
 */

const FormInput = {
    /**
     * Initialize a form input with validation
     * @param {Object} config - Configuration object
     * @param {string} config.inputId - Input element ID
     * @param {string} config.errorId - Error message element ID
     * @param {string} config.validationType - Validation type (email, password, username, required)
     * @param {Object} config.validationOptions - Additional validation options
     * @param {Function} config.onValidate - Callback when validation runs
     */
    init(config) {
        const { inputId, errorId, validationType, validationOptions = {}, onValidate } = config;
        
        const input = DOM.$(inputId);
        if (!input) return;
        
        // Clear error on input
        DOM.on(input, 'input', () => {
            DOM.clearFieldError(inputId, errorId);
            
            // Run live validation if callback provided
            if (onValidate) {
                const value = input.value;
                const result = this.validate(value, validationType, validationOptions);
                onValidate(result, value);
            }
        });
        
        // Validate on blur
        DOM.on(input, 'blur', () => {
            const value = input.value;
            const result = this.validate(value, validationType, validationOptions);
            
            if (!result.valid && value.length > 0) {
                DOM.showFieldError(inputId, errorId, result.message);
            }
        });
        
        return {
            getValue: () => input.value,
            setValue: (value) => { input.value = value; },
            validate: () => this.validate(input.value, validationType, validationOptions),
            showError: (message) => DOM.showFieldError(inputId, errorId, message),
            clearError: () => DOM.clearFieldError(inputId, errorId),
            focus: () => input.focus(),
        };
    },
    
    /**
     * Validate input value
     * @param {string} value - Value to validate
     * @param {string} type - Validation type
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validate(value, type, options = {}) {
        switch (type) {
            case 'email':
                return Validation.email(value);
            case 'password':
                return Validation.password(value, options);
            case 'username':
                return Validation.username(value);
            case 'captcha':
                return Validation.captchaAnswer(value);
            case 'required':
            default:
                return {
                    valid: !!value && String(value).trim().length > 0,
                    message: options.message || 'This field is required.',
                };
        }
    },
};

// Export for use in other modules
window.FormInput = FormInput;
