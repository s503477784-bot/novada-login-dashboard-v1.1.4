/**
 * =============================================================================
 * Novada Auth System - Routes Index
 * =============================================================================
 * Central routing configuration that aggregates all API routes
 */

const express = require('express');
const path = require('path');
const router = express.Router();

// Read version from package.json (single source of truth)
const { version: APP_VERSION } = require(path.join(__dirname, '../../package.json'));

// Import route modules
const authRoutes = require('./auth.routes');

/**
 * API Health Check
 * GET /api/health
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
        version: APP_VERSION,
    });
});

/**
 * Client IP Detection
 * GET /api/client-ip
 */
router.get('/client-ip', (req, res) => {
    const ip = req.ip || req.socket?.remoteAddress || '';
    // Strip IPv6-mapped IPv4 prefix (::ffff:)
    const cleanIp = ip.replace(/^::ffff:/, '');
    res.json({
        success: true,
        data: { ip: cleanIp },
    });
});

/**
 * Authentication Routes
 * /api/auth/*
 */
router.use('/auth', authRoutes);

/**
 * 404 handler for undefined API routes
 */
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
    });
});

module.exports = router;
