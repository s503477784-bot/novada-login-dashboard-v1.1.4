/**
 * =============================================================================
 * Novada Auth + Dashboard - Server Entry Point
 * =============================================================================
 */

require('dotenv').config();

const { app } = require('./app');
const { testConnection, closePool } = require('./config/database');
const { query: dbQuery } = require('./config/database');
const { cleanupExpiredSessions } = require('./middleware/captchaValidator');

const REQUIRED_ENV_VARS = ['DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

let cleanupInterval = null;

const validateEnvironment = () => {
    const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        console.warn('='.repeat(60));
        console.warn('  WARNING: Missing required environment variables:');
        missing.forEach((key) => console.warn(`    - ${key}`));
        console.warn('  Auth APIs may be unavailable until your .env file is complete.');
        console.warn('='.repeat(60));
        return false;
    }

    // Warn if access and refresh tokens share the same secret
    if (
        process.env.JWT_SECRET &&
        (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET)
    ) {
        console.warn('[SECURITY] JWT_ACCESS_SECRET and/or JWT_REFRESH_SECRET not set.');
        console.warn('[SECURITY] Access and refresh tokens are sharing JWT_SECRET.');
        console.warn('[SECURITY] Set separate secrets in production for better security.');
    }

    return true;
};

const registerShutdownHandlers = (server) => {
    const shutdown = async (signal) => {
        console.log(`[SERVER] Received ${signal}, shutting down gracefully...`);
        if (cleanupInterval) {
            clearInterval(cleanupInterval);
            cleanupInterval = null;
        }

        const forceTimer = setTimeout(() => {
            console.error('[SERVER] Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
        forceTimer.unref();

        server.close(async () => {
            try {
                await closePool();
            } finally {
                process.exit(0);
            }
        });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
};

const startServer = async () => {
    const envOk = validateEnvironment();

    let dbOk = false;
    if (envOk) {
        dbOk = await testConnection();
        if (!dbOk) {
            console.warn('[WARN] Database connection failed at startup. Static pages will still load, but auth APIs may return errors until the database is available.');
        }
    }

    if (dbOk) {
        try {
            await dbQuery('SELECT 1 FROM revoked_tokens LIMIT 1');
        } catch (error) {
            if (error?.code === 'ER_NO_SUCH_TABLE') {
                console.error('='.repeat(60));
                console.error('  FATAL: revoked_tokens table does not exist.');
                console.error('  Logout and token rotation will NOT work.');
                console.error('  Apply database/migrations/001_add_username_unique_and_revoked_tokens.sql');
                console.error('='.repeat(60));
            }
        }
    }

    const server = app.listen(PORT, HOST, () => {
        console.log('='.repeat(60));
        console.log('  Novada Auth + Dashboard');
        console.log('='.repeat(60));
        console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`  Server:      http://${HOST}:${PORT}`);
        console.log(`  API:         http://${HOST}:${PORT}/api`);
        if (!envOk || !dbOk) {
            console.log('  Status:      Running in degraded mode (static pages available, auth backend needs configuration or database access)');
        }
        console.log('='.repeat(60));
    });

    if (envOk && dbOk) {
        cleanupInterval = setInterval(() => {
            cleanupExpiredSessions().catch((error) => {
                console.error('[CLEANUP] Captcha cleanup failed:', error);
            });
        }, 30 * 60 * 1000);
    }

    registerShutdownHandlers(server);
    return server;
};

if (require.main === module) {
    startServer();
}

module.exports = {
    app,
    startServer,
    REQUIRED_ENV_VARS,
};
