/**
 * =============================================================================
 * Novada Auth System - Form Validation Utilities
 * =============================================================================
 * Client-side form validation helpers
 * 
 * NOTE: This is for UX improvement only. Server-side validation is the
 * authoritative validation layer.
 */

const Validation = {
    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {Object} { valid: boolean, message: string }
     */
    email(email) {
        if (!email || typeof email !== 'string') {
            return {
                valid: false,
                message: 'Email address is required.',
            };
        }
        
        const trimmed = email.trim();
        
        if (trimmed.length === 0) {
            return {
                valid: false,
                message: 'Email address is required.',
            };
        }
        
        if (trimmed.length > 254) {
            return {
                valid: false,
                message: 'Email address is too long (max 254 characters).',
            };
        }

        const localPart = trimmed.split('@')[0] || '';
        if (localPart.length > 64) {
            return {
                valid: false,
                message: 'Email local part is too long (max 64 characters).',
            };
        }

        // RFC 5322 compliant email regex (simplified)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

        if (!emailRegex.test(trimmed)) {
            return {
                valid: false,
                message: 'Please enter a valid email address.',
            };
        }
        
        return { valid: true, message: '' };
    },
    
    /**
     * Validate password
     * @param {string} password - Password to validate
     * @param {Object} options - Validation options
     * @returns {Object} { valid: boolean, message: string, strength: string }
     */
    password(password, options = {}) {
        const {
            minLength = 8,
            maxLength = 72,
            requireUppercase = true,
            requireLowercase = true,
            requireNumber = true,
            requireSpecial = true,
        } = options;
        
        if (!password) {
            return {
                valid: false,
                message: 'Password is required.',
                strength: 'none',
            };
        }
        
        if (password.length < minLength) {
            return {
                valid: false,
                message: `Password must be at least ${minLength} characters.`,
                strength: 'weak',
            };
        }

        if (password.length > maxLength) {
            return {
                valid: false,
                message: `Password must not exceed ${maxLength} characters.`,
                strength: 'weak',
            };
        }
        
        // Check additional requirements
        if (requireUppercase && !/[A-Z]/.test(password)) {
            return {
                valid: false,
                message: 'Password must contain at least one uppercase letter.',
                strength: 'weak',
            };
        }
        
        if (requireLowercase && !/[a-z]/.test(password)) {
            return {
                valid: false,
                message: 'Password must contain at least one lowercase letter.',
                strength: 'weak',
            };
        }
        
        if (requireNumber && !/[0-9]/.test(password)) {
            return {
                valid: false,
                message: 'Password must contain at least one number.',
                strength: 'weak',
            };
        }
        
        if (requireSpecial && !/[^a-zA-Z0-9\s]/.test(password)) {
            return {
                valid: false,
                message: 'Password must contain at least one special character.',
                strength: 'weak',
            };
        }
        
        // Calculate strength
        const strength = this.calculatePasswordStrength(password);
        
        return {
            valid: true,
            message: '',
            strength,
        };
    },
    
    /**
     * Calculate password strength
     * @param {string} password - Password to analyze
     * @returns {string} 'weak' | 'medium' | 'strong'
     */
    /** Common weak passwords that pass format rules but are easily guessable */
    _commonPasswords: [
        'password', 'password1', 'password123', 'qwerty123', 'abc12345',
        'letmein1', 'welcome1', 'admin123', 'monkey123', 'dragon12',
        '12345678', '123456789', '1234567890', 'iloveyou1', 'sunshine1',
        'princess1', 'football1', 'charlie1', 'shadow12', 'master12',
    ],

    calculatePasswordStrength(password) {
        if (!password) return 'none';

        // Check against common passwords
        if (this._commonPasswords.includes(password.toLowerCase())) {
            return 'weak';
        }

        let score = 0;

        // Length scoring
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (password.length >= 16) score++;

        // Character variety scoring
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^a-zA-Z0-9\s]/.test(password)) score++;

        // Penalize sequential/repeating patterns
        if (/(.)\1{2,}/.test(password)) score--;
        if (/(?:abc|bcd|cde|def|efg|123|234|345|456|567|678|789|qwe|wer|ert|asd|sdf)/i.test(password)) score--;

        // Determine strength
        if (score <= 3) return 'weak';
        if (score <= 5) return 'medium';
        return 'strong';
    },
    
    /**
     * Validate username format
     * @param {string} username - Username to validate
     * @returns {Object} { valid: boolean, message: string }
     */
    username(username) {
        if (!username || typeof username !== 'string') {
            return { valid: false, message: 'Username is required.' };
        }
        if (!/^[a-zA-Z0-9_-]{3,50}$/.test(username.trim())) {
            return { valid: false, message: 'Username must be 3-50 characters, alphanumeric with underscores/hyphens.' };
        }
        return { valid: true, message: '' };
    },

    /**
     * Validate password confirmation matches
     * @param {string} password - Original password
     * @param {string} confirmPassword - Confirmation password
     * @returns {Object} { valid: boolean, message: string }
     */
    passwordMatch(password, confirmPassword) {
        if (!confirmPassword) {
            return {
                valid: false,
                message: 'Please confirm your password.',
            };
        }
        
        if (password !== confirmPassword) {
            return {
                valid: false,
                message: 'Passwords do not match.',
            };
        }
        
        return { valid: true, message: '' };
    },
    
    /**
     * Validate captcha answer
     * @param {string|number} answer - Captcha answer
     * @returns {Object} { valid: boolean, message: string }
     */
    captchaAnswer(answer) {
        if (answer === undefined || answer === null || answer === '') {
            return {
                valid: false,
                message: 'Security check required.',
            };
        }
        
        const num = parseInt(answer, 10);
        
        if (isNaN(num)) {
            return {
                valid: false,
                message: 'Please enter a valid number.',
            };
        }
        
        return { valid: true, message: '' };
    },
    
    /**
     * Validate an entire form
     * @param {Object} fields - Field values keyed by field name
     * @param {Object} rules - Validation rules for each field
     * @returns {Object} { valid: boolean, errors: Object }
     */
    form(fields, rules) {
        const errors = {};
        let valid = true;
        
        for (const [fieldName, rule] of Object.entries(rules)) {
            const value = fields[fieldName];
            let result;
            
            switch (rule.type) {
                case 'email':
                    result = this.email(value);
                    break;
                case 'password':
                    result = this.password(value, rule.options);
                    break;
                case 'passwordMatch':
                    result = this.passwordMatch(fields[rule.compareWith], value);
                    break;
                case 'captcha':
                    result = this.captchaAnswer(value);
                    break;
                case 'required':
                default:
                    result = {
                        valid: !!value && String(value).trim().length > 0,
                        message: rule.message || `${fieldName} is required.`,
                    };
            }
            
            if (!result.valid) {
                errors[fieldName] = result.message;
                valid = false;
            }
        }
        
        return { valid, errors };
    },
};

// Export for use in other modules
window.Validation = Validation;