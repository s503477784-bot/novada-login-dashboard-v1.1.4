/**
 * =============================================================================
 * Novada Auth System - Input Sanitizer Middleware
 * =============================================================================
 * Sanitizes and validates all incoming request data.
 *
 * DESIGN PHILOSOPHY:
 * - Input time: strip control chars, warn on dangerous patterns
 * - Output time: escape for the target context (HTML, SQL, etc.)
 * - Parameterized queries are the PRIMARY defense against SQL injection
 *
 * SECURITY FIXES:
 * - Regex patterns have NO 'g' flag to avoid lastIndex state bug
 * - Sensitive fields compared in lowercase via Set for correct matching
 */

const validator = require('validator');

/**
 * Dangerous patterns — NO 'g' flag to avoid .test() lastIndex bug
 */
const DANGEROUS_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|UNION|FETCH|DECLARE|CAST)\b)/i,
    /(-{2}|\/\*|\*\/|;)/,
    /(('|")\s*(OR|AND)\s*('|")?[^'"]*?(=|LIKE))/i,
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /\.\.\//,
    /\.\.\\/,
];

/**
 * Fields whose values must NEVER be modified.
 * Stored in lowercase for case-insensitive lookup.
 */
const PASSTHROUGH_FIELDS = new Set([
    'password',
    'confirmpassword',
    'currentpassword',
    'newpassword',
]);

const containsDangerousPattern = (str) => {
    if (typeof str !== 'string') return false;
    return DANGEROUS_PATTERNS.some(pattern => pattern.test(str));
};

const sanitizeValue = (value, key = '') => {
    if (value === null || value === undefined) return value;

    if (Array.isArray(value)) {
        return value.map((item, i) => sanitizeValue(item, `${key}[${i}]`));
    }

    if (typeof value === 'object') {
        const sanitized = {};
        for (const [k, v] of Object.entries(value)) {
            sanitized[k] = sanitizeValue(v, key ? `${key}.${k}` : k);
        }
        return sanitized;
    }

    if (typeof value === 'string') {
        const fieldName = (key.split('.').pop() || key).toLowerCase();

        // Never touch password fields
        if (PASSTHROUGH_FIELDS.has(fieldName)) return value;

        // Strip null bytes and control characters, keep newlines
        let sanitized = value.trim();
        sanitized = sanitized.replace(/\0/g, '');
        sanitized = validator.stripLow(sanitized, true);

        // Warn but don't mutate — real defense is parameterized queries.
        // Only log in development to avoid false-positive noise in production
        // (passwords and legitimate text can contain SQL keywords).
        if (process.env.NODE_ENV === 'development' && containsDangerousPattern(sanitized)) {
            console.warn(`[SECURITY] Suspicious input in field "${key}"`);
        }

        return sanitized;
    }

    return value;
};

const isValidEmail = (email) => {
    if (typeof email !== 'string') return false;
    return validator.isEmail(email, {
        allow_display_name: false,
        require_display_name: false,
        allow_utf8_local_part: false,
    });
};

const isValidUsername = (username) => {
    if (typeof username !== 'string') return false;
    // Accepts Proxy + 8 alphanumeric chars (new format) and legacy Proxy + 5 digits
    return /^[a-zA-Z0-9_-]{3,50}$/.test(username);
};

/**
 * Global sanitization middleware
 */
const inputSanitizer = (req, res, next) => {
    try {
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeValue(req.body, 'body');
        }
        if (req.query && typeof req.query === 'object') {
            req.query = sanitizeValue(req.query, 'query');
        }
        if (req.params && typeof req.params === 'object') {
            req.params = sanitizeValue(req.params, 'params');
        }
        next();
    } catch (error) {
        console.error('[SANITIZER] Error:', error);
        res.status(400).json({
            success: false,
            message: 'Invalid request data',
            code: 'INVALID_INPUT',
        });
    }
};

/**
 * Route-specific validation middleware
 * Username is auto-generated; not required from frontend.
 */
const validateAuthInput = (type) => {
    return (req, res, next) => {
        const { email, password, username, confirmPassword } = req.body;
        const errors = [];

        if (type === 'login' || type === 'register') {
            if (!email) {
                errors.push({ field: 'email', message: 'Email is required' });
            } else if (!isValidEmail(email)) {
                errors.push({ field: 'email', message: 'Invalid email format' });
            }
            if (!password) {
                errors.push({ field: 'password', message: 'Password is required' });
            }
        }

        if (type === 'register') {
            // If client sends username (unusual), validate it
            if (username && !isValidUsername(username)) {
                errors.push({ field: 'username', message: 'Username must be 3-50 chars, alphanumeric with _/-' });
            }

            if (password) {
                if (password.length < 8) {
                    errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
                }
                if (password.length > 72) {
                    errors.push({ field: 'password', message: 'Password must not exceed 72 characters' });
                }
                if (!/[A-Z]/.test(password)) {
                    errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter' });
                }
                if (!/[a-z]/.test(password)) {
                    errors.push({ field: 'password', message: 'Password must contain at least one lowercase letter' });
                }
                if (!/[0-9]/.test(password)) {
                    errors.push({ field: 'password', message: 'Password must contain at least one number' });
                }
                if (!/[^a-zA-Z0-9\s]/.test(password)) {
                    errors.push({ field: 'password', message: 'Password must contain at least one special character (e.g. !@#$%^&*)' });
                }
            }

            if (!confirmPassword) {
                errors.push({ field: 'confirmPassword', message: 'Please confirm your password' });
            } else if (password !== confirmPassword) {
                errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors });
        }
        next();
    };
};

module.exports = {
    inputSanitizer,
    validateAuthInput,
    sanitizeValue,
    isValidEmail,
    isValidUsername,
    containsDangerousPattern,
};
