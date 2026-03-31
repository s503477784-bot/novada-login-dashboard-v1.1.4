/**
 * =============================================================================
 * Novada Auth System - User Model
 * =============================================================================
 * Database operations for user management
 *
 * SECURITY NOTICE:
 * - All queries use parameterized statements to prevent SQL injection
 * - Passwords are never returned in general query results
 */

const db = require('../config/database');

/**
 * Generate a unique username in format Proxy********
 * where ******** is a random 8-character alphanumeric string.
 * This gives ~2.8 trillion possible values (62^8), virtually
 * eliminating collisions compared to the old 5-digit scheme (90k).
 * Uniqueness is still enforced at INSERT time via DB unique constraint
 * + outer retry loop in controller to avoid race conditions.
 * @returns {string} Generated username (uniqueness enforced at INSERT time)
 */
const generateUniqueUsername = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let suffix = '';
    const { randomInt } = require('crypto');
    for (let i = 0; i < 8; i++) {
        suffix += chars[randomInt(chars.length)];
    }
    return `Proxy${suffix}`;
};

/**
 * User model with database operations
 */
const User = {
    /**
     * Create a new user
     */
    async create({ username, email, passwordHash }) {
        const result = await db.query(
            `INSERT INTO users (username, email, password_hash, status, created_at) 
             VALUES (?, ?, ?, 'active', NOW())`,
            [username, email.toLowerCase(), passwordHash]
        );
        return result.insertId;
    },

    /**
     * Find user by ID (no password hash)
     */
    async findById(id) {
        const users = await db.query(
            `SELECT id, username, email, status, created_at, updated_at 
             FROM users WHERE id = ? LIMIT 1`,
            [id]
        );
        return users.length > 0 ? users[0] : null;
    },

    /**
     * Find user by email (includes password hash for authentication)
     */
    async findByEmail(email) {
        const users = await db.query(
            `SELECT id, username, email, password_hash, status, created_at, updated_at 
             FROM users WHERE email = ? LIMIT 1`,
            [email.toLowerCase()]
        );
        return users.length > 0 ? users[0] : null;
    },

    /**
     * Find user by username
     */
    async findByUsername(username) {
        const users = await db.query(
            `SELECT id, username, email, status, created_at, updated_at 
             FROM users WHERE username = ? LIMIT 1`,
            [username]
        );
        return users.length > 0 ? users[0] : null;
    },

    /**
     * Check if email exists
     */
    async emailExists(email) {
        const result = await db.query(
            'SELECT 1 FROM users WHERE email = ? LIMIT 1',
            [email.toLowerCase()]
        );
        return result.length > 0;
    },

    /**
     * Check if username exists
     */
    async usernameExists(username) {
        const result = await db.query(
            'SELECT 1 FROM users WHERE username = ? LIMIT 1',
            [username]
        );
        return result.length > 0;
    },

    /**
     * Update user information
     */
    async update(id, updates) {
        const allowedFields = ['username', 'email'];
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }
        if (fields.length === 0) return false;

        values.push(id);
        const result = await db.query(
            `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
            values
        );
        return result.affectedRows > 0;
    },

    /**
     * Update user password
     */
    async updatePassword(id, passwordHash) {
        const result = await db.query(
            'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
            [passwordHash, id]
        );
        return result.affectedRows > 0;
    },

    /**
     * Disable user account
     */
    async disable(id) {
        const result = await db.query(
            `UPDATE users SET status = 'disabled', updated_at = NOW() WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    },

    /**
     * Enable user account
     */
    async enable(id) {
        const result = await db.query(
            `UPDATE users SET status = 'active', updated_at = NOW() WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    },

    /**
     * Log a login attempt for security tracking
     */
    async logLoginAttempt(email, ipAddress, success, failureReason = null, userAgent = null) {
        try {
            // Truncate user agent to prevent storing excessively long values
            const safeUserAgent = userAgent ? String(userAgent).substring(0, 512) : null;
            await db.query(
                `INSERT INTO login_attempts (email, ip_address, user_agent, success, failure_reason, attempted_at)
                 VALUES (?, ?, ?, ?, ?, NOW())`,
                [email, ipAddress, safeUserAgent, success, failureReason]
            );
        } catch (error) {
            console.error('[USER] Failed to log login attempt:', error);
        }
    },

    /**
     * Get recent failed login attempts for an IP/email
     */
    async getRecentFailedAttempts(ipAddress, email = null, windowMinutes = 15) {
        let query = `
            SELECT COUNT(*) as count 
            FROM login_attempts 
            WHERE ip_address = ? 
              AND success = FALSE 
              AND attempted_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)
        `;
        const params = [ipAddress, windowMinutes];

        if (email) {
            query += ' AND email = ?';
            params.push(email);
        }

        const result = await db.query(query, params);
        return result[0]?.count || 0;
    },
};

module.exports = User;
module.exports.generateUniqueUsername = generateUniqueUsername;
