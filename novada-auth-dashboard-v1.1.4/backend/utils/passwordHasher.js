/**
 * =============================================================================
 * Novada Auth System - Password Hasher Utility
 * =============================================================================
 * Secure password hashing and verification using BCrypt
 * 
 * SECURITY NOTES:
 * - Uses BCrypt with configurable cost factor
 * - Cost factor of 12 recommended for production
 * - Never stores or logs plaintext passwords
 */

const bcrypt = require('bcrypt');

/**
 * BCrypt configuration
 * Higher rounds = more secure but slower
 * Recommended: 10-12 for most applications
 */
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;

/**
 * Hash a plaintext password
 * @param {string} password - Plaintext password to hash
 * @returns {Promise<string>} BCrypt hash
 * @throws {Error} If password is empty or hashing fails
 */
const hashPassword = async (password) => {
    if (!password || typeof password !== 'string') {
        throw new Error('Password must be a non-empty string');
    }
    
    try {
        const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    } catch (error) {
        console.error('[PASSWORD] Hashing error:', error.message);
        throw new Error('Password hashing failed');
    }
};

/**
 * Verify a password against a stored hash
 * @param {string} password - Plaintext password to verify
 * @param {string} hash - Stored BCrypt hash
 * @returns {Promise<boolean>} True if password matches
 */
const verifyPassword = async (password, hash) => {
    if (!password || !hash) {
        return false;
    }
    
    try {
        const isMatch = await bcrypt.compare(password, hash);
        return isMatch;
    } catch (error) {
        console.error('[PASSWORD] Verification error:', error.message);
        return false;
    }
};

/**
 * Check if a password meets minimum strength requirements
 * @param {string} password - Password to check
 * @returns {Object} { valid: boolean, errors: string[] }
 */
const validatePasswordStrength = (password) => {
    const errors = [];
    
    if (!password || typeof password !== 'string') {
        return { valid: false, errors: ['Password is required'] };
    }
    
    // Minimum length
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    
    // Maximum length (BCrypt has a limit of 72 bytes)
    if (password.length > 72) {
        errors.push('Password must not exceed 72 characters');
    }
    
    // Strength requirements (consistent with inputSanitizer.validateAuthInput)
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (!/[^a-zA-Z0-9\s]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
};

/**
 * Check if a hash needs to be rehashed
 * Useful when upgrading BCrypt rounds
 * @param {string} hash - Existing BCrypt hash
 * @returns {boolean} True if rehashing is needed
 */
const needsRehash = (hash) => {
    if (!hash) return true;
    
    try {
        // Extract rounds from hash
        const rounds = bcrypt.getRounds(hash);
        return rounds < BCRYPT_ROUNDS;
    } catch (error) {
        return true;
    }
};

module.exports = {
    hashPassword,
    verifyPassword,
    validatePasswordStrength,
    needsRehash,
    BCRYPT_ROUNDS,
};
