/**
 * =============================================================================
 * Novada Auth System - Response Handler Utility
 * =============================================================================
 * Standardized API response formatting
 * Ensures consistent response structure across all endpoints
 */

/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Object} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const successResponse = (res, message, data = null, statusCode = 200) => {
    const response = {
        success: true,
        message,
        timestamp: new Date().toISOString(),
    };
    
    if (data !== null) {
        response.data = data;
    }
    
    return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {string} code - Error code for client handling
 * @param {Array} errors - Validation errors array
 */
const errorResponse = (res, message, statusCode = 400, code = null, errors = null) => {
    const response = {
        success: false,
        message,
        timestamp: new Date().toISOString(),
    };
    
    if (code) {
        response.code = code;
    }
    
    if (errors) {
        response.errors = errors;
    }
    
    return res.status(statusCode).json(response);
};

/**
 * Send a paginated response
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Array} items - Array of items
 * @param {Object} pagination - Pagination info { page, limit, total }
 */
const paginatedResponse = (res, message, items, { page, limit, total }) => {
    const totalPages = Math.ceil(total / limit);
    
    return res.status(200).json({
        success: true,
        message,
        timestamp: new Date().toISOString(),
        data: {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        },
    });
};

/**
 * HTTP Status Codes Reference
 */
const HttpStatus = {
    // Success
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    
    // Client Errors
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    
    // Server Errors
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    SERVICE_UNAVAILABLE: 503,
};

/**
 * Common Error Codes
 */
const ErrorCodes = {
    // Authentication
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    EMAIL_EXISTS: 'EMAIL_EXISTS',
    USERNAME_EXISTS: 'USERNAME_EXISTS',
    ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    
    // Validation
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    
    // Rate Limiting
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    
    // Captcha
    CAPTCHA_INVALID: 'CAPTCHA_INVALID',
    CAPTCHA_EXPIRED: 'CAPTCHA_EXPIRED',
    
    // General
    NOT_FOUND: 'NOT_FOUND',
    SERVER_ERROR: 'SERVER_ERROR',
    NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
};

module.exports = {
    successResponse,
    errorResponse,
    paginatedResponse,
    HttpStatus,
    ErrorCodes,
};
