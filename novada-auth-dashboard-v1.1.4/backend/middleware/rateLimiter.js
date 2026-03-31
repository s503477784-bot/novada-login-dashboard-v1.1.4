/**
 * =============================================================================
 * Novada Auth System - Rate Limiter Middleware
 * =============================================================================
 * Implements rate limiting to prevent brute force attacks and API abuse
 * 
 * SECURITY FEATURES:
 * - IP-based rate limiting
 * - Separate limits for authentication endpoints
 * - Progressive delays on repeated failures
 */

const rateLimit = require('express-rate-limit');

if (process.env.NODE_ENV === 'production') {
    console.warn('[SECURITY] Rate limiters are using in-memory storage. Consider using rate-limit-redis for multi-instance deployments.');
}

/**
 * Global rate limiter for all API requests
 * Applies a general limit to prevent abuse
 */
const globalRateLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100, // 100 requests per window
    
    // Response configuration
    message: {
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: null, // Will be set dynamically
    },
    
    // Custom handler for rate limit exceeded
    handler: (req, res, next, options) => {
        const retryAfter = Math.ceil(options.windowMs / 1000);
        res.status(429).json({
            ...options.message,
            retryAfter,
        });
    },
    
    // Use IP from X-Forwarded-For header (for proxies/load balancers)
    standardHeaders: true,
    legacyHeaders: false,
    
    // Skip successful requests in the count (optional)
    skipSuccessfulRequests: false,
    
    // Key generator (default: IP address)
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress || 'unknown';
    },
});

/**
 * Strict rate limiter for authentication endpoints
 * More restrictive to prevent brute force attacks
 */
const authRateLimiter = rateLimit({
    windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 10) || 5 * 60 * 1000, // 5 minutes
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS, 10) || 5, // 5 attempts per window
    
    message: {
        success: false,
        message: 'Too many login attempts. Please try again in 5 minutes.',
        code: 'RATE_LIMIT_AUTH',
    },
    
    handler: (req, res, next, options) => {
        const retryAfter = Math.ceil(options.windowMs / 1000);
        
        // Log the blocked attempt for security monitoring
        console.warn('[SECURITY] Rate limit exceeded for auth:', {
            ip: req.ip,
            path: req.path,
            timestamp: new Date().toISOString(),
        });
        
        res.status(429).json({
            ...options.message,
            retryAfter,
        });
    },
    
    standardHeaders: true,
    legacyHeaders: false,
    
    // Key generator combines IP and attempted email for better tracking
    keyGenerator: (req) => {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const email = req.body?.email || '';
        return `${ip}:${email}`;
    },
    
    // Skip counting successful logins
    skipSuccessfulRequests: true,
});

const authIpCeilingLimiter = rateLimit({
    windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 10) || 5 * 60 * 1000,
    max: 15,

    message: {
        success: false,
        message: 'Too many login attempts from this IP. Please try again in 5 minutes.',
        code: 'RATE_LIMIT_IP_CEILING',
    },

    handler: (req, res, next, options) => {
        const retryAfter = Math.ceil(options.windowMs / 1000);

        console.warn('[SECURITY] IP ceiling rate limit exceeded:', {
            ip: req.ip,
            path: req.path,
            timestamp: new Date().toISOString(),
        });

        res.status(429).json({
            ...options.message,
            retryAfter,
        });
    },

    standardHeaders: true,
    legacyHeaders: false,

    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress || 'unknown';
    },

    skipSuccessfulRequests: true,
});

/**
 * Registration rate limiter
 * Prevents spam account creation
 */
const registerRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registration attempts per hour per IP
    
    message: {
        success: false,
        message: 'Registration limit reached. Please try again later.',
        code: 'RATE_LIMIT_REGISTER',
    },
    
    handler: (req, res, next, options) => {
        console.warn('[SECURITY] Registration rate limit exceeded:', {
            ip: req.ip,
            timestamp: new Date().toISOString(),
        });
        
        res.status(429).json({
            ...options.message,
            retryAfter: Math.ceil(options.windowMs / 1000),
        });
    },
    
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Captcha request rate limiter
 * Prevents captcha spam
 */
const captchaRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 captcha requests per minute
    
    message: {
        success: false,
        message: 'Too many captcha requests. Please slow down.',
        code: 'RATE_LIMIT_CAPTCHA',
    },
    
    standardHeaders: true,
    legacyHeaders: false,
});

const refreshRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,

    message: {
        success: false,
        message: 'Too many refresh requests. Please slow down.',
        code: 'RATE_LIMIT_REFRESH',
    },

    standardHeaders: true,
    legacyHeaders: false,
});

const logoutRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,

    message: {
        success: false,
        message: 'Too many logout requests. Please slow down.',
        code: 'RATE_LIMIT_LOGOUT',
    },

    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    globalRateLimiter,
    authRateLimiter,
    authIpCeilingLimiter,
    registerRateLimiter,
    captchaRateLimiter,
    refreshRateLimiter,
    logoutRateLimiter,
};
