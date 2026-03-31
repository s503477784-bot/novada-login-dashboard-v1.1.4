/**
 * =============================================================================
 * Novada Auth System - Express App Bootstrap
 * =============================================================================
 * Creates the Express application without starting the HTTP listener.
 * This keeps the app testable and avoids side effects during imports.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');

const routes = require('./routes');
const { globalRateLimiter } = require('./middleware/rateLimiter');
const { inputSanitizer } = require('./middleware/inputSanitizer');
const { resolveAuthenticatedUser } = require('./controllers/auth.controller');

const parseTrustProxySetting = () => {
    const raw = String(process.env.TRUST_PROXY || '').trim().toLowerCase();

    if (!raw || raw === 'false' || raw === 'off' || raw === 'none') {
        return false;
    }

    if (raw === 'true') {
        return 1;
    }

    const numeric = Number(raw);
    if (Number.isInteger(numeric) && numeric >= 0) {
        return numeric;
    }

    return process.env.TRUST_PROXY;
};

const setStaticCacheHeaders = (res, filePath) => {
    const normalizedPath = String(filePath || '').replace(/\\/g, '/');
    const isVersionedAsset = /\.[a-f0-9]{8,}\.(css|js|svg|png|jpe?g|webp)$/i.test(normalizedPath);

    res.setHeader('Vary', 'Accept-Encoding');

    if (normalizedPath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store');
        return;
    }

    if (isVersionedAsset) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return;
    }

    if (normalizedPath.endsWith('.css') || normalizedPath.endsWith('.js')) {
        res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
        return;
    }

    if (/\.(svg|png|jpe?g|webp)$/i.test(normalizedPath)) {
        res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    }
};


const getDashboardIndexPath = (dashboardDistDir) => path.join(dashboardDistDir, 'index.html');

const sendDashboardIndex = (res, dashboardDistDir) => {
    const dashboardIndexPath = getDashboardIndexPath(dashboardDistDir);
    if (!fs.existsSync(dashboardIndexPath)) {
        return res.status(503).send('Dashboard build is missing. Run `npm run build:frontend` first.');
    }
    return res.sendFile(dashboardIndexPath);
};

const ensureDashboardSession = async (req, res, next) => {
    try {
        const session = await resolveAuthenticatedUser(req, res, { allowRefresh: true });
        if (!session) {
            return res.redirect('/auth/login.html');
        }

        req.authUser = session.user;
        res.locals.authSession = session;
        return next();
    } catch (error) {
        console.error('[AUTH] Dashboard page guard failed:', error);
        return res.redirect('/auth/login.html');
    }
};

const createApp = () => {
    const app = express();

    app.set('trust proxy', parseTrustProxySetting());

    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                connectSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
            },
        },
        crossOriginEmbedderPolicy: false,
    }));

    const corsOrigins = process.env.CORS_ALLOWED_ORIGINS
        ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
        : (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173']);

    if (process.env.NODE_ENV === 'production' && corsOrigins.length === 0) {
        console.warn('[SECURITY] CORS_ALLOWED_ORIGINS not set in production. Cross-origin requests will be rejected.');
    }

    const corsOptions = {
        origin: corsOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        credentials: true,
        maxAge: 86400,
    };
    app.use(cors(corsOptions));

    app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

    app.use(express.json({ limit: '10kb' }));
    app.use(express.urlencoded({ extended: true, limit: '10kb' }));
    app.use(inputSanitizer);

    const authPagesDir = path.join(__dirname, '../auth-pages');
    const dashboardDistDir = path.join(__dirname, '../frontend/dist');

    app.use('/auth', express.static(authPagesDir, {
        etag: true,
        lastModified: true,
        setHeaders: setStaticCacheHeaders,
    }));

    // CSRF protection: require custom header on all state-changing API requests
    const csrfProtection = (req, res, next) => {
        if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
            return next();
        }
        if (req.headers['x-requested-with']) {
            return next();
        }
        return res.status(403).json({
            success: false,
            message: 'Missing required security header. Please refresh the page and try again.',
            code: 'CSRF_REJECTED',
        });
    };

    app.use('/api', globalRateLimiter, csrfProtection, routes);

    app.get('/', (req, res) => {
        return res.redirect('/auth/login.html');
    });

    app.get(['/login', '/login.html'], (req, res) => {
        return res.redirect('/auth/login.html');
    });

    app.get(['/register', '/register.html'], (req, res) => {
        return res.redirect('/auth/register.html');
    });

    app.get(['/dashboard', '/dashboard.html'], (req, res) => {
        return res.redirect('/app/');
    });

    app.get(['/app', '/app/', '/app/index.html'], ensureDashboardSession, (req, res) => {
        return sendDashboardIndex(res, dashboardDistDir);
    });

    app.get('/auth/login', (req, res) => res.redirect('/auth/login.html'));
    app.get('/auth/register', (req, res) => res.redirect('/auth/register.html'));

    if (fs.existsSync(dashboardDistDir)) {
        app.use('/app', express.static(dashboardDistDir, {
            etag: true,
            index: false,
            lastModified: true,
            setHeaders: setStaticCacheHeaders,
        }));
    }

    app.get('*', (req, res) => {
        if (req.path.startsWith('/app')) {
            if (path.extname(req.path)) {
                return res.status(404).send('Not found');
            }

            return ensureDashboardSession(req, res, () => sendDashboardIndex(res, dashboardDistDir));
        }

        if (req.path.startsWith('/auth')) {
            return res.redirect('/auth/login.html');
        }

        return res.redirect('/auth/login.html');
    });

    app.use((err, req, res, next) => {
        console.error('[ERROR]', err.stack);
        const isDev = process.env.NODE_ENV === 'development';
        return res.status(err.status || 500).json({
            success: false,
            message: isDev ? err.message : 'Internal server error',
            // Only expose stack trace in explicit development mode
            ...(isDev && { stack: err.stack }),
            // Never expose database error details
        });
    });

    return app;
};

const app = createApp();

module.exports = {
    app,
    createApp,
};
