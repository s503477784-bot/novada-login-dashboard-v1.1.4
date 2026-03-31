/**
 * =============================================================================
 * Novada Auth System - Captcha Validator Middleware
 * =============================================================================
 * Server-side captcha verification to prevent automated attacks
 * 
 * SECURITY FEATURES:
 * - Server-side answer validation (answer never sent to client)
 * - Token-based session management
 * - Expiration and single-use tokens
 * - Cryptographic hash comparison
 */

const crypto = require('crypto');
const db = require('../config/database');

/**
 * Captcha configuration
 */
const CAPTCHA_CONFIG = {
    expiresIn: parseInt(process.env.CAPTCHA_EXPIRES_IN, 10) || 300, // 5 minutes
    tokenLength: 32,
    hashAlgorithm: 'sha256',
};

/**
 * Generate a cryptographically secure token
 * @returns {string} Random hex token
 */
const generateToken = () => {
    return crypto.randomBytes(CAPTCHA_CONFIG.tokenLength).toString('hex');
};

/**
 * Hash the captcha answer for secure storage
 * @param {string|number} answer - The captcha answer
 * @param {string} token - The session token (used as salt)
 * @returns {string} Hashed answer
 */
const hashAnswer = (answer, token) => {
    return crypto
        .createHmac(CAPTCHA_CONFIG.hashAlgorithm, token)
        .update(String(answer))
        .digest('hex');
};

/**
 * Generate a new captcha challenge
 * Creates a math problem and stores the hashed answer server-side
 * @returns {Promise<Object>} Captcha data { token, question }
 */
const generateCaptcha = async () => {
    const operators = ['+', '-', '×'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let num1 = Math.floor(Math.random() * 15) + 1;
    let num2 = Math.floor(Math.random() * 9) + 1;
    
    // Ensure subtraction doesn't result in negative
    if (operator === '-' && num1 < num2) {
        [num1, num2] = [num2, num1];
    }
    
    // Calculate answer
    let answer;
    switch (operator) {
        case '+':
            answer = num1 + num2;
            break;
        case '-':
            answer = num1 - num2;
            break;
        case '×':
            answer = num1 * num2;
            break;
    }
    
    // Generate token and hash answer
    const token = generateToken();
    const answerHash = hashAnswer(answer, token);
    
    // Calculate expiration time
    const expiresAt = new Date(Date.now() + CAPTCHA_CONFIG.expiresIn * 1000);
    
    // Store in database
    await db.query(
        `INSERT INTO captcha_sessions (token, answer_hash, expires_at) VALUES (?, ?, ?)`,
        [token, answerHash, expiresAt]
    );
    
    // Return token and question (NOT the answer)
    return {
        token,
        question: `${num1} ${operator} ${num2}`,
    };
};

/**
 * Pre-verify a captcha answer WITHOUT consuming the token.
 * Used for real-time UX feedback; the authoritative check still
 * happens in captchaValidatorMiddleware on form submit.
 * @param {string} token - The captcha session token
 * @param {string|number} userAnswer - The user's answer
 * @returns {Promise<Object>} Verification result { valid, message }
 */
const preVerifyCaptcha = async (token, userAnswer) => {
    if (!token || userAnswer === undefined || userAnswer === null) {
        return {
            valid: false,
            message: 'Captcha token and answer are required',
            newCaptcha: null,
        };
    }

    try {
        const sessions = await db.query(
            `SELECT * FROM captcha_sessions
             WHERE token = ? AND is_used = FALSE AND expires_at > UTC_TIMESTAMP()
             LIMIT 1`,
            [token]
        );

        if (sessions.length === 0) {
            const fresh = await generateCaptcha();
            return {
                valid: false,
                message: 'Captcha expired. A new problem has been generated.',
                newCaptcha: { token: fresh.token, question: fresh.question },
            };
        }

        const session = sessions[0];

        const userAnswerHash = hashAnswer(userAnswer, token);
        const isValid = crypto.timingSafeEqual(
            Buffer.from(session.answer_hash),
            Buffer.from(userAnswerHash)
        );

        if (!isValid) {
            // Wrong answer — consume the old token and issue a fresh captcha
            await db.query(
                `UPDATE captcha_sessions SET is_used = TRUE WHERE token = ?`,
                [token]
            );
            const fresh = await generateCaptcha();
            return {
                valid: false,
                message: 'Incorrect answer. A new problem has been generated.',
                newCaptcha: { token: fresh.token, question: fresh.question },
            };
        }

        return {
            valid: true,
            message: 'Captcha answer is correct',
            newCaptcha: null,
        };
    } catch (error) {
        console.error('[CAPTCHA] Pre-verification error:', error);
        return {
            valid: false,
            message: 'Captcha verification failed. Please try again.',
            newCaptcha: null,
        };
    }
};

/**
 * Verify a captcha answer
 * @param {string} token - The captcha session token
 * @param {string|number} userAnswer - The user's answer
 * @returns {Promise<Object>} Verification result { valid, message }
 */
const verifyCaptcha = async (token, userAnswer) => {
    if (!token || userAnswer === undefined || userAnswer === null) {
        return {
            valid: false,
            message: 'Captcha token and answer are required',
        };
    }
    
    try {
        // Fetch the captcha session
        const sessions = await db.query(
            `SELECT * FROM captcha_sessions 
             WHERE token = ? AND is_used = FALSE AND expires_at > UTC_TIMESTAMP()
             LIMIT 1`,
            [token]
        );
        
        if (sessions.length === 0) {
            return {
                valid: false,
                message: 'Invalid or expired captcha. Please refresh and try again.',
            };
        }
        
        const session = sessions[0];
        
        // Hash the user's answer and compare
        const userAnswerHash = hashAnswer(userAnswer, token);
        const isValid = crypto.timingSafeEqual(
            Buffer.from(session.answer_hash),
            Buffer.from(userAnswerHash)
        );
        
        // Mark token as used (regardless of result to prevent retry attacks)
        await db.query(
            `UPDATE captcha_sessions SET is_used = TRUE WHERE token = ?`,
            [token]
        );
        
        if (!isValid) {
            return {
                valid: false,
                message: 'Incorrect captcha answer. Please try again.',
            };
        }
        
        return {
            valid: true,
            message: 'Captcha verified successfully',
        };
        
    } catch (error) {
        console.error('[CAPTCHA] Verification error:', error);
        return {
            valid: false,
            message: 'Captcha verification failed. Please try again.',
        };
    }
};

/**
 * Express middleware to validate captcha on protected routes
 * Expects { captchaToken, captchaAnswer } in request body
 */
const captchaValidatorMiddleware = async (req, res, next) => {
    const { captchaToken, captchaAnswer } = req.body;
    
    // Skip validation if captcha is already verified (e.g., by controller)
    if (req.captchaVerified) {
        return next();
    }
    
    const result = await verifyCaptcha(captchaToken, captchaAnswer);
    
    if (!result.valid) {
        return res.status(400).json({
            success: false,
            message: result.message,
            code: 'CAPTCHA_INVALID',
        });
    }
    
    // Mark as verified for downstream handlers
    req.captchaVerified = true;
    next();
};

/**
 * Cleanup expired captcha sessions
 * Should be called periodically or via cron
 */
const cleanupExpiredSessions = async () => {
    try {
        const result = await db.query(
            `DELETE FROM captcha_sessions WHERE expires_at < UTC_TIMESTAMP() OR is_used = TRUE`
        );
        console.log(`[CAPTCHA] Cleaned up ${result.affectedRows} expired sessions`);
    } catch (error) {
        console.error('[CAPTCHA] Cleanup error:', error);
    }
};

module.exports = {
    generateCaptcha,
    verifyCaptcha,
    preVerifyCaptcha,
    captchaValidatorMiddleware,
    cleanupExpiredSessions,
};
