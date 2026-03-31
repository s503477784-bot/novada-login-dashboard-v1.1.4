/**
 * =============================================================================
 * Novada Auth System - API Client
 * =============================================================================
 * Centralized API request handling
 *
 * SECURITY NOTE:
 * - JWT is stored in an HttpOnly cookie, NOT in JS-accessible storage
 * - credentials: 'include' sends the cookie automatically
 * - localStorage/sessionStorage only hold UX hints ("logged in"), never tokens
 */

const API = {
    baseUrl: '/api',
    timeout: 30000,

    /** Non-sensitive UX hint keys — NOT security-relevant */
    storageKeys: {
        local: 'auth_state_persistent',
        session: 'auth_state_session',
    },

    /**
     * Make an API request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        const hasBody = Object.prototype.hasOwnProperty.call(options, 'body');
        const config = {
            method: options.method || 'GET',
            headers: {
                'X-Requested-With': 'NovadaClient',
                ...options.headers,
            },
            credentials: 'include',   // Send HttpOnly cookie
        };

        if (hasBody) {
            config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
            config.body = JSON.stringify(options.body);
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                ...config,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Robust parsing: text first, then try JSON
            const rawText = await response.text();
            let data = null;

            if (rawText) {
                try {
                    data = JSON.parse(rawText);
                } catch {
                    data = {
                        success: response.ok,
                        message: rawText,
                    };
                }
            } else {
                data = {
                    success: response.ok,
                    message: response.ok ? 'Request completed successfully.' : 'Request failed.',
                };
            }

            if (!response.ok) {
                throw {
                    status: response.status,
                    ...data,
                };
            }

            return data;

        } catch (error) {
            if (error.name === 'AbortError') {
                throw {
                    success: false,
                    message: 'Request timeout. Please try again.',
                    code: 'TIMEOUT',
                };
            }
            throw error;
        }
    },

    async get(endpoint, params = {}) {
        const qs = new URLSearchParams(params).toString();
        const url = qs ? `${endpoint}?${qs}` : endpoint;
        return this.request(url, { method: 'GET' });
    },

    async post(endpoint, body = {}) {
        return this.request(endpoint, { method: 'POST', body });
    },

    // ----- UX auth hints (NOT security checks) -----

    setAuthState(remember = false) {
        this.clearAuthState();
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(remember ? this.storageKeys.local : this.storageKeys.session, '1');
    },

    getAuthStateHint() {
        return localStorage.getItem(this.storageKeys.local)
            || sessionStorage.getItem(this.storageKeys.session);
    },

    clearAuthState() {
        localStorage.removeItem(this.storageKeys.local);
        sessionStorage.removeItem(this.storageKeys.session);
    },

    /** Quick UX check — NOT a security check */
    isAuthenticated() {
        return this.getAuthStateHint() === '1';
    },
};

/**
 * Authentication API methods
 */
const AuthAPI = {
    /**
     * Register a new user (username auto-generated server-side as Proxy*****)
     */
    async register(data) {
        return API.post('/auth/register', {
            email: data.email,
            password: data.password,
            confirmPassword: data.confirmPassword,
            captchaToken: data.captchaToken,
            captchaAnswer: data.captchaAnswer,
        });
    },

    /**
     * Login — server sets HttpOnly cookie
     */
    async login(data) {
        const result = await API.post('/auth/login', {
            email: data.email,
            password: data.password,
            captchaToken: data.captchaToken,
            captchaAnswer: data.captchaAnswer,
            rememberMe: data.rememberMe || false,
        });

        if (result.success) {
            API.setAuthState(Boolean(data.rememberMe));
        }

        return result;
    },

    /**
     * Logout — server revokes token + clears cookie
     */
    async logout() {
        try {
            await API.post('/auth/logout');
        } finally {
            API.clearAuthState();
        }
    },

    /**
     * Get new captcha challenge
     */
    async getCaptcha() {
        return API.get('/auth/captcha');
    },

    /**
     * Pre-check captcha answer (non-destructive: does NOT consume the token)
     * Used for real-time UX feedback before form submission.
     */
    async verifyCaptchaPreCheck(token, answer) {
        return API.post('/auth/captcha/verify', {
            captchaToken: token,
            captchaAnswer: answer,
        });
    },

    /**
     * Refresh current auth session via backend
     */
    async refreshAuth() {
        return API.post('/auth/refresh', {});
    },

    /**
     * Verify current auth session via backend
     */
    async verifyAuth() {
        try {
            return await API.get('/auth/verify');
        } catch (error) {
            if (error.status === 401 || error.code === 'INVALID_TOKEN'
                || error.code === 'USER_INVALID' || error.code === 'NO_TOKEN'
                || error.code === 'INVALID_REFRESH_TOKEN') {
                API.clearAuthState();
            }
            throw error;
        }
    },

    /**
     * Check whether a valid backend session exists
     */
    async hasValidSession() {
        try {
            await this.verifyAuth();
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Google OAuth login (placeholder)
     */
    async googleLogin(credential) {
        return API.post('/auth/google', { credential });
    },
};

window.API = API;
window.AuthAPI = AuthAPI;
