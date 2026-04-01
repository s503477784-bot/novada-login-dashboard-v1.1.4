/**
 * =============================================================================
 * Novada Auth System - Centralized Error Messages
 * =============================================================================
 * Maps API error codes to user-friendly messages with reference codes.
 *
 * Reference code format: [REF: AREA-NNN]
 *   - AREA identifies the subsystem for customer-service / tech triage
 *   - AUTH   = authentication flow
 *   - CAPTCHA = captcha subsystem
 *   - RATE   = rate limiting
 *   - REG    = registration
 *   - SESSION = session / token management
 *   - NET    = network / connectivity
 *   - SYS    = system / server-side
 *   - CSRF   = cross-site request forgery protection
 */

const ErrorMessages = {
    /** Map of error code → { text, ref } */
    messages: {
        // Authentication
        INVALID_CREDENTIALS: {
            text: 'The email or password you entered is incorrect. Please check and try again.',
            ref: 'AUTH-001',
        },
        ACCOUNT_DISABLED: {
            text: 'Your account has been disabled. Please contact support for assistance.',
            ref: 'AUTH-002',
        },

        // Captcha
        CAPTCHA_INVALID: {
            text: 'Incorrect answer or the captcha has expired. Please solve the new problem.',
            ref: 'CAPTCHA-001',
        },

        // Rate limiting
        RATE_LIMIT_AUTH: {
            text: 'Too many login attempts. Please wait 5 minutes before trying again.',
            ref: 'RATE-001',
        },
        RATE_LIMIT_REGISTER: {
            text: 'Too many registration attempts. Please try again later.',
            ref: 'RATE-002',
        },
        RATE_LIMIT_CAPTCHA: {
            text: 'Too many captcha requests. Please slow down and try again shortly.',
            ref: 'RATE-003',
        },
        RATE_LIMIT_REFRESH: {
            text: 'Session refresh rate limit exceeded. Please wait a moment and try again.',
            ref: 'RATE-004',
        },

        // Registration
        EMAIL_EXISTS: {
            text: 'This email address is already registered. Try logging in instead.',
            ref: 'REG-001',
        },
        UID_GENERATION_FAILED: {
            text: 'Failed to create your account due to a temporary issue. Please try again.',
            ref: 'REG-002',
        },
        VALIDATION_ERROR: {
            text: 'Some fields contain invalid values. Please review and correct them.',
            ref: 'REG-003',
        },

        // Session
        INVALID_TOKEN: {
            text: 'Your session has expired. Please log in again to continue.',
            ref: 'SESSION-001',
        },
        INVALID_REFRESH_TOKEN: {
            text: 'Your session could not be renewed. Please log in again.',
            ref: 'SESSION-002',
        },
        USER_INVALID: {
            text: 'Your account was not found or has been disabled. Please contact support.',
            ref: 'SESSION-003',
        },
        NO_TOKEN: {
            text: 'You are not signed in. Please log in to access this page.',
            ref: 'SESSION-004',
        },

        // CSRF
        CSRF_REJECTED: {
            text: 'Your request was blocked for security reasons. Please refresh the page and try again.',
            ref: 'CSRF-001',
        },

        // Network
        TIMEOUT: {
            text: 'The request timed out. Please check your internet connection and try again.',
            ref: 'NET-001',
        },
        NETWORK_ERROR: {
            text: 'Unable to connect to the server. Please check your internet connection.',
            ref: 'NET-002',
        },

        // System
        SERVER_ERROR: {
            text: 'An unexpected error occurred on our end. Please try again later.',
            ref: 'SYS-001',
        },
        NOT_IMPLEMENTED: {
            text: 'This feature is not yet available. Stay tuned for updates.',
            ref: 'SYS-002',
        },
        INVALID_INPUT: {
            text: 'The request contained invalid data. Please check your input and try again.',
            ref: 'SYS-003',
        },
    },

    /**
     * Get a user-friendly message for an error code, with reference code appended.
     * @param {string} code - The API error code
     * @param {string} fallback - Fallback message if code is not mapped
     * @returns {string} User-facing error message with reference code
     */
    get(code, fallback = 'Something went wrong. Please try again.') {
        const entry = this.messages[code];
        return entry ? entry.text : fallback;
    },

    /**
     * Get only the user-facing text without the reference code.
     * @param {string} code - The API error code
     * @param {string} fallback - Fallback message if code is not mapped
     * @returns {string} User-facing error message
     */
    getText(code, fallback = 'Something went wrong. Please try again.') {
        const entry = this.messages[code];
        return entry ? entry.text : fallback;
    },

    /**
     * Get only the reference code for an error.
     * @param {string} code - The API error code
     * @returns {string|null} Reference code or null
     */
    getRef(code) {
        const entry = this.messages[code];
        return entry ? entry.ref : null;
    },
};

window.ErrorMessages = ErrorMessages;
