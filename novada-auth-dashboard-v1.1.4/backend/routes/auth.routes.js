/**
 * =============================================================================
 * Novada Auth System - Authentication Routes
 * =============================================================================
 * Defines all authentication-related API endpoints
 */

const express = require('express');
const router = express.Router();

// Import middleware
const { authRateLimiter, authIpCeilingLimiter, registerRateLimiter, captchaRateLimiter, refreshRateLimiter, logoutRateLimiter } = require('../middleware/rateLimiter');
const { captchaValidatorMiddleware } = require('../middleware/captchaValidator');
const { validateAuthInput } = require('../middleware/inputSanitizer');

// Import controller
const authController = require('../controllers/auth.controller');

/**
 * POST /api/auth/register
 * Register a new user account
 * Username (Proxy*****) is auto-generated server-side
 * 
 * Request body:
 * {
 *   email: string,
 *   password: string,
 *   confirmPassword: string,
 *   captchaToken: string,
 *   captchaAnswer: number
 * }
 */
router.post(
    '/register',
    authIpCeilingLimiter,
    registerRateLimiter,
    validateAuthInput('register'),
    captchaValidatorMiddleware,
    authController.register
);

/**
 * POST /api/auth/login
 * Authenticate user and set HttpOnly auth cookie
 * 
 * Request body:
 * {
 *   email: string,
 *   password: string,
 *   captchaToken: string,
 *   captchaAnswer: number,
 *   rememberMe?: boolean
 * }
 */
router.post(
    '/login',
    authIpCeilingLimiter,
    authRateLimiter,
    validateAuthInput('login'),
    captchaValidatorMiddleware,
    authController.login
);

/**
 * GET /api/auth/captcha
 * Generate a new captcha challenge
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     token: string,
 *     question: string
 *   }
 * }
 */
router.get(
    '/captcha',
    captchaRateLimiter,
    authController.getCaptcha
);

/**
 * POST /api/auth/captcha/verify
 * Pre-check captcha answer (non-destructive, does NOT consume the token)
 * Used for real-time UX feedback before form submission.
 *
 * Request body:
 * {
 *   captchaToken: string,
 *   captchaAnswer: number
 * }
 */
router.post(
    '/captcha/verify',
    captchaRateLimiter,
    authController.preCheckCaptcha
);

/**
 * POST /api/auth/google
 * Authenticate via Google OAuth
 * 
 * Request body:
 * {
 *   credential: string (Google ID token)
 * }
 */
router.post(
    '/google',
    authRateLimiter,
    authController.googleAuth
);

/**
 * POST /api/auth/logout
 * Revoke token + clear HttpOnly cookie
 */
router.post(
    '/logout',
    logoutRateLimiter,
    authController.logout
);

/**
 * POST /api/auth/refresh
 * Refresh a short-lived access token using the refresh cookie
 */
router.post(
    '/refresh',
    refreshRateLimiter,
    authController.refreshSession
);

/**
 * GET /api/auth/verify
 * Verify if the current token is valid
 * Used for checking authentication status
 */
router.get(
    '/verify',
    authController.verifyToken
);

module.exports = router;
