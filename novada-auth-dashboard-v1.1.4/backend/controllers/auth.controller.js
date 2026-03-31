/**
 * =============================================================================
 * Novada Auth System - Authentication Controller
 * =============================================================================
 * Handles all authentication-related business logic.
 *
 * Token transport: HttpOnly cookies (access + refresh) with optional Bearer
 * access-token fallback for API compatibility.
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const db = require('../config/database');
const User = require('../models/User');
const { generateUniqueUsername } = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/passwordHasher');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { generateCaptcha, preVerifyCaptcha } = require('../middleware/captchaValidator');

// =============================================================================
// Token revocation helpers (DB-backed, safe for multi-instance deployments)
// =============================================================================

let lastRevocationCleanupAt = 0;
let revocationStoreUnavailableLogged = false;
const REVOCATION_CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

const isRevocationStoreUnavailable = (error) => error?.code === 'ER_NO_SUCH_TABLE';

const logRevocationStoreFallback = (error) => {
    if (revocationStoreUnavailableLogged) {
        return;
    }

    revocationStoreUnavailableLogged = true;
    console.warn('[AUTH] revoked_tokens table is unavailable. Falling back to non-durable logout revocation until the migration is applied.', error?.message || '');
};

const getTokenFingerprint = (token) => {
    if (!token) return null;

    const decoded = jwt.decode(token);
    const identifier = decoded?.jti || token;

    return crypto
        .createHash('sha256')
        .update(String(identifier))
        .digest('hex');
};

const maybeCleanupRevokedTokens = async () => {
    const now = Date.now();
    if (now - lastRevocationCleanupAt < REVOCATION_CLEANUP_INTERVAL_MS) {
        return;
    }

    lastRevocationCleanupAt = now;
    try {
        await db.query('DELETE FROM revoked_tokens WHERE expires_at <= NOW()');
    } catch (error) {
        if (isRevocationStoreUnavailable(error)) {
            logRevocationStoreFallback(error);
            return;
        }

        console.error('[AUTH] Failed to cleanup revoked tokens:', error.message);
    }
};

const revokeToken = async (token, tokenType) => {
    if (!token) return;

    const decoded = jwt.decode(token);
    const fingerprint = getTokenFingerprint(token);
    if (!fingerprint) return;

    const expiresAt = decoded?.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 24 * 60 * 60 * 1000);

    await maybeCleanupRevokedTokens();

    try {
        await db.query(
            `INSERT INTO revoked_tokens (token_hash, token_type, expires_at, created_at)
             VALUES (?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE token_type = VALUES(token_type), expires_at = VALUES(expires_at)`,
            [fingerprint, tokenType || decoded?.type || 'access', expiresAt]
        );
    } catch (error) {
        if (isRevocationStoreUnavailable(error)) {
            logRevocationStoreFallback(error);
            return;
        }

        throw error;
    }
};

const isTokenRevoked = async (token, expectedType = null) => {
    const fingerprint = getTokenFingerprint(token);
    if (!fingerprint) return false;

    await maybeCleanupRevokedTokens();

    try {
        const rows = await db.query(
            `SELECT token_type
             FROM revoked_tokens
             WHERE token_hash = ? AND expires_at > NOW()
             LIMIT 1`,
            [fingerprint]
        );

        if (rows.length === 0) {
            return false;
        }

        return expectedType ? rows[0].token_type === expectedType : true;
    } catch (error) {
        if (isRevocationStoreUnavailable(error)) {
            logRevocationStoreFallback(error);
            return false;
        }

        throw error;
    }
};

// =============================================================================
// Cookie helpers
// =============================================================================

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'auth_token';
const REFRESH_COOKIE_NAME = process.env.AUTH_REFRESH_COOKIE_NAME || 'refresh_token';

const getCookieSameSite = () => {
    const raw = String(process.env.AUTH_COOKIE_SAMESITE || 'lax').trim().toLowerCase();
    if (raw === 'strict' || raw === 'none') return raw;
    return 'lax';
};

/**
 * Determine whether cookies should have the Secure flag.
 * - Explicit 'true'/'false' in AUTH_COOKIE_SECURE always wins.
 * - Otherwise, defaults to true ONLY in production.
 * - In development (or when NODE_ENV is unset), defaults to false
 *   so cookies work on http://localhost without extra config.
 */
const shouldUseSecureCookies = () => {
    const raw = String(process.env.AUTH_COOKIE_SECURE || '').trim().toLowerCase();
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return process.env.NODE_ENV === 'production';
};

const getCookieBaseOptions = () => {
    const sameSite = getCookieSameSite();

    return {
        httpOnly: true,
        secure: sameSite === 'none' ? true : shouldUseSecureCookies(),
        sameSite,
        path: '/',
    };
};

const buildCookieOptions = (token, overrides = {}) => {
    const options = {
        ...getCookieBaseOptions(),
        ...overrides,
    };

    const decoded = jwt.decode(token);
    if (decoded?.exp) {
        options.expires = new Date(decoded.exp * 1000);
    }

    return options;
};

const clearAuthCookies = (res) => {
    res.clearCookie(AUTH_COOKIE_NAME, getCookieBaseOptions());
    res.clearCookie(REFRESH_COOKIE_NAME, getCookieBaseOptions());
};

const parseCookies = (req) => {
    const cookieHeader = req.headers.cookie || '';

    return cookieHeader.split(';').reduce((acc, part) => {
        const idx = part.indexOf('=');
        if (idx > 0) {
            const key = part.slice(0, idx).trim();
            const value = part.slice(idx + 1).trim();
            try {
                acc[key] = decodeURIComponent(value);
            } catch {
                acc[key] = value;
            }
        }
        return acc;
    }, {});
};

const extractTokenFromRequest = (req, { cookieName = AUTH_COOKIE_NAME, allowBearerFallback = false } = {}) => {
    const cookies = parseCookies(req);
    if (cookies[cookieName]) {
        return cookies[cookieName];
    }

    if (allowBearerFallback) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
        }
    }

    return null;
};

// =============================================================================
// JWT helpers
// =============================================================================

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '12h';
const REFRESH_TOKEN_REMEMBER_EXPIRES_IN = process.env.JWT_REFRESH_REMEMBER_EXPIRES_IN
    || process.env.JWT_REMEMBER_EXPIRES_IN
    || '30d';

const buildTokenPayload = (user, type, extra = {}) => ({
    userId: user.id,
    email: user.email,
    username: user.username,
    type,
    jti: crypto.randomUUID(),
    ...extra,
});

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const generateAccessToken = (user) => {
    const payload = buildTokenPayload(user, 'access');
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
};

const generateRefreshToken = (user, rememberMe = false) => {
    const payload = buildTokenPayload(user, 'refresh', { rememberMe });
    const expiresIn = rememberMe ? REFRESH_TOKEN_REMEMBER_EXPIRES_IN : REFRESH_TOKEN_EXPIRES_IN;
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn });
};

const verifyJwtToken = async (token, expectedType) => {
    if (!token) return null;

    const secret = expectedType === 'refresh' ? REFRESH_TOKEN_SECRET : ACCESS_TOKEN_SECRET;

    try {
        const decoded = jwt.verify(token, secret);
        if (decoded?.type !== expectedType) {
            return null;
        }

        if (await isTokenRevoked(token, expectedType)) {
            return null;
        }

        return decoded;
    } catch {
        return null;
    }
};

const issueSessionCookies = (res, user, rememberMe = false) => {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user, rememberMe);

    const accessOpts = buildCookieOptions(accessToken);
    const refreshOpts = buildCookieOptions(refreshToken);

    res.cookie(AUTH_COOKIE_NAME, accessToken, accessOpts);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshOpts);

    // Help developers diagnose cookie issues on localhost
    if (process.env.NODE_ENV === 'development') {
        console.log('[AUTH] Issuing session cookies:', {
            secure: accessOpts.secure,
            sameSite: accessOpts.sameSite,
            httpOnly: accessOpts.httpOnly,
            rememberMe,
            hint: accessOpts.secure
                ? 'Cookies require HTTPS. Use AUTH_COOKIE_SECURE=false for http://localhost.'
                : 'Cookies will work over HTTP (development mode).',
        });
    }

    return {
        accessToken,
        refreshToken,
    };
};

const getDuplicateKeyName = (error) => {
    const raw = `${error?.sqlMessage || ''} ${error?.message || ''}`;

    if (/uk_users_username|for key ['`"]?uk_users_username/i.test(raw)) {
        return 'username';
    }

    if (/uk_users_email|for key ['`"]?uk_users_email/i.test(raw)) {
        return 'email';
    }

    return null;
};

const restoreSessionFromRefreshToken = async (req, res) => {
    const refreshToken = extractTokenFromRequest(req, {
        cookieName: REFRESH_COOKIE_NAME,
        allowBearerFallback: false,
    });

    const refreshPayload = await verifyJwtToken(refreshToken, 'refresh');
    if (!refreshPayload) {
        return null;
    }

    // Atomically revoke the old token — if already revoked, another request won
    const fingerprint = getTokenFingerprint(refreshToken);
    if (fingerprint) {
        try {
            const decoded = jwt.decode(refreshToken);
            const expiresAt = decoded?.exp
                ? new Date(decoded.exp * 1000)
                : new Date(Date.now() + 24 * 60 * 60 * 1000);

            // INSERT IGNORE: if another concurrent request already inserted, this returns affectedRows=0
            const result = await db.query(
                `INSERT IGNORE INTO revoked_tokens (token_hash, token_type, expires_at, created_at)
                 VALUES (?, 'refresh', ?, NOW())`,
                [fingerprint, expiresAt]
            );

            if (result.affectedRows === 0) {
                // Another request already consumed this refresh token — reject
                return null;
            }
        } catch (error) {
            if (error?.code === 'ER_NO_SUCH_TABLE') {
                // revoked_tokens table missing — fall through but log once
                if (!revocationStoreUnavailableLogged) {
                    revocationStoreUnavailableLogged = true;
                    console.warn('[AUTH] revoked_tokens table is unavailable. Refresh token rotation is not atomic.');
                }
            } else {
                console.warn('[AUTH] Failed to atomically revoke refresh token:', error.message);
                return null;
            }
        }
    }

    const user = await User.findById(refreshPayload.userId);
    if (!user || user.status !== 'active') {
        return null;
    }

    // Preserve rememberMe from old refresh token so session intent survives rotation
    const rememberMe = Boolean(refreshPayload.rememberMe);

    // Issue new access token AND new refresh token (preserving rememberMe)
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user, rememberMe);

    res.cookie(AUTH_COOKIE_NAME, newAccessToken, buildCookieOptions(newAccessToken));
    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, buildCookieOptions(newRefreshToken));

    return user;
};

// =============================================================================
// Controllers
// =============================================================================

const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return errorResponse(res, 'Email already registered', 409, 'EMAIL_EXISTS');
        }

        const passwordHash = await hashPassword(password);

        let createdUserId = null;
        let generatedUsername = null;

        for (let attempt = 0; attempt < 8; attempt += 1) {
            generatedUsername = generateUniqueUsername();

            try {
                createdUserId = await User.create({
                    username: generatedUsername,
                    email,
                    passwordHash,
                });
                break;
            } catch (error) {
                if (error?.code !== 'ER_DUP_ENTRY') {
                    throw error;
                }

                const duplicateKey = getDuplicateKeyName(error);
                if (duplicateKey === 'username') {
                    continue;
                }

                if (duplicateKey === 'email') {
                    return errorResponse(res, 'Email already registered', 409, 'EMAIL_EXISTS');
                }

                throw error;
            }
        }

        if (!createdUserId) {
            return errorResponse(
                res,
                'Failed to allocate a unique account ID. Please try again.',
                503,
                'UID_GENERATION_FAILED'
            );
        }

        return successResponse(res, 'Registration successful', {
            userId: createdUserId,
            username: generatedUsername,
        }, 201);
    } catch (error) {
        console.error('[AUTH] Registration error:', error);
        return errorResponse(res, 'Registration failed. Please try again.', 500);
    }
};

const login = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        const user = await User.findByEmail(email);
        if (!user) {
            // Dummy bcrypt compare to prevent timing-based user enumeration.
            // This is a valid bcrypt hash of a random string (cost 12) so
            // bcrypt.compare will NOT throw and will run in constant time.
            await verifyPassword(password, '$2b$12$AekxzlXcAtNgdCnRj1ZV4uqd3VNvPsVgAgKXMzdegjJJ/pPDRFQOy');
            await User.logLoginAttempt(email, req.ip, false, 'User not found', req.get('User-Agent'));
            return errorResponse(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
        }

        if (user.status !== 'active') {
            await User.logLoginAttempt(email, req.ip, false, 'Account disabled', req.get('User-Agent'));
            return errorResponse(res, 'Account is disabled. Please contact support.', 403, 'ACCOUNT_DISABLED');
        }

        const isValidPassword = await verifyPassword(password, user.password_hash);
        if (!isValidPassword) {
            await User.logLoginAttempt(email, req.ip, false, 'Invalid password', req.get('User-Agent'));
            return errorResponse(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
        }

        await User.logLoginAttempt(email, req.ip, true, null, req.get('User-Agent'));

        issueSessionCookies(res, user, Boolean(rememberMe));

        return successResponse(res, 'Login successful', {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
            session: {
                persistent: Boolean(rememberMe),
                transport: 'httpOnly-cookies',
                accessTokenStrategy: 'short-lived-with-refresh',
            },
        });
    } catch (error) {
        console.error('[AUTH] Login error:', error);
        return errorResponse(res, 'Login failed. Please try again.', 500);
    }
};

const getCaptcha = async (req, res) => {
    try {
        const captcha = await generateCaptcha();
        return successResponse(res, 'Captcha generated', {
            token: captcha.token,
            question: captcha.question,
        });
    } catch (error) {
        console.error('[AUTH] Captcha generation error:', error);
        return errorResponse(res, 'Failed to generate captcha', 500);
    }
};

const preCheckCaptcha = async (req, res) => {
    try {
        const { captchaToken, captchaAnswer } = req.body;

        if (!captchaToken || captchaAnswer === undefined || captchaAnswer === null) {
            return errorResponse(res, 'Token and answer are required', 400, 'CAPTCHA_INVALID');
        }

        const result = await preVerifyCaptcha(captchaToken, captchaAnswer);

        const data = {
            valid: result.valid,
            message: result.message,
        };

        if (result.newCaptcha) {
            data.newCaptcha = result.newCaptcha;
        }

        return successResponse(res, result.message, data);
    } catch (error) {
        console.error('[AUTH] Captcha pre-check error:', error);
        return errorResponse(res, 'Captcha pre-check failed', 500);
    }
};

const googleAuth = async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return errorResponse(res, 'Google credential is required', 400);
        }

        return errorResponse(res, 'Google authentication not yet configured', 501, 'NOT_IMPLEMENTED');
    } catch (error) {
        console.error('[AUTH] Google auth error:', error);
        return errorResponse(res, 'Google authentication failed', 500);
    }
};

const logout = async (req, res) => {
    try {
        const accessToken = extractTokenFromRequest(req, {
            cookieName: AUTH_COOKIE_NAME,
            allowBearerFallback: true,
        });
        const refreshToken = extractTokenFromRequest(req, {
            cookieName: REFRESH_COOKIE_NAME,
            allowBearerFallback: false,
        });

        if (accessToken) {
            await revokeToken(accessToken, 'access');
        }
        if (refreshToken) {
            await revokeToken(refreshToken, 'refresh');
        }

        clearAuthCookies(res);
        return successResponse(res, 'Logout successful');
    } catch (error) {
        console.error('[AUTH] Logout error:', error);
        clearAuthCookies(res);
        return errorResponse(res, 'Logout failed', 500);
    }
};

const refreshSession = async (req, res) => {
    try {
        const user = await restoreSessionFromRefreshToken(req, res);
        if (!user) {
            clearAuthCookies(res);
            return errorResponse(res, 'Refresh token is invalid or expired', 401, 'INVALID_REFRESH_TOKEN');
        }

        return successResponse(res, 'Session refreshed', {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
            session: {
                transport: 'httpOnly-cookies',
                refreshed: true,
            },
        });
    } catch (error) {
        console.error('[AUTH] Session refresh error:', error);
        clearAuthCookies(res);
        return errorResponse(res, 'Session refresh failed', 500);
    }
};


const resolveAuthenticatedUser = async (req, res, { allowRefresh = true } = {}) => {
    const accessToken = extractTokenFromRequest(req, {
        cookieName: AUTH_COOKIE_NAME,
        allowBearerFallback: true,
    });

    let decoded = await verifyJwtToken(accessToken, 'access');
    let user = null;
    let refreshed = false;

    if (decoded) {
        user = await User.findById(decoded.userId);
    } else if (allowRefresh) {
        user = await restoreSessionFromRefreshToken(req, res);
        refreshed = Boolean(user);
    }

    if (!user || user.status !== 'active') {
        clearAuthCookies(res);
        return null;
    }

    return {
        user,
        refreshed,
    };
};

const verifyToken = async (req, res) => {
    try {
        const session = await resolveAuthenticatedUser(req, res, { allowRefresh: true });
        if (!session) {
            return errorResponse(res, 'User account not found, disabled, or session expired', 401, 'USER_INVALID');
        }

        return successResponse(res, 'Token is valid', {
            user: {
                id: session.user.id,
                username: session.user.username,
                email: session.user.email,
            },
            session: {
                transport: 'httpOnly-cookies',
                refreshed: session.refreshed,
            },
        });
    } catch (error) {
        console.error('[AUTH] Token verification error:', error);
        clearAuthCookies(res);
        return errorResponse(res, 'Token verification failed', 500);
    }
};

module.exports = {
    register,
    login,
    getCaptcha,
    preCheckCaptcha,
    googleAuth,
    logout,
    refreshSession,
    verifyToken,
    resolveAuthenticatedUser,
};
