/**
 * =============================================================================
 * Novada Auth System - DOM Utilities
 * =============================================================================
 * Helper functions for DOM manipulation
 */

const DOM = {
    /**
     * Get element by ID
     * @param {string} id - Element ID
     * @returns {HTMLElement|null} Element or null
     */
    $(id) {
        return document.getElementById(id);
    },
    
    /**
     * Query selector
     * @param {string} selector - CSS selector
     * @param {HTMLElement} context - Parent element (default: document)
     * @returns {HTMLElement|null} First matching element
     */
    qs(selector, context = document) {
        return context.querySelector(selector);
    },
    
    /**
     * Query selector all
     * @param {string} selector - CSS selector
     * @param {HTMLElement} context - Parent element (default: document)
     * @returns {NodeList} All matching elements
     */
    qsa(selector, context = document) {
        return context.querySelectorAll(selector);
    },
    
    /**
     * Show error message for a form field
     * @param {string} inputId - Input element ID
     * @param {string} errorId - Error message element ID
     * @param {string} message - Error message to display
     */
    showFieldError(inputId, errorId, message) {
        const input = this.$(inputId);
        const errorEl = this.$(errorId);
        
        if (input) {
            input.classList.add('is-error');
        }
        
        if (errorEl) {
            if (message) {
                errorEl.textContent = message;
            }
            errorEl.style.display = 'block';
            errorEl.classList.add('visible');
        }
    },
    
    /**
     * Clear error state from a form field
     * @param {string} inputId - Input element ID
     * @param {string} errorId - Error message element ID
     */
    clearFieldError(inputId, errorId) {
        const input = this.$(inputId);
        const errorEl = this.$(errorId);
        
        if (input) {
            input.classList.remove('is-error');
        }
        
        if (errorEl) {
            errorEl.style.display = 'none';
            errorEl.classList.remove('visible');
        }
    },
    
    /**
     * Clear all form errors
     * @param {HTMLFormElement} form - Form element
     */
    clearAllErrors(form) {
        if (!form) return;
        
        const errorInputs = form.querySelectorAll('.is-error');
        const errorMessages = form.querySelectorAll('.field-error-msg');
        
        errorInputs.forEach(input => input.classList.remove('is-error'));
        errorMessages.forEach(msg => {
            msg.style.display = 'none';
            msg.classList.remove('visible');
        });
    },
    
    /**
     * Show/hide loading state
     * @param {boolean} show - Whether to show loading
     * @param {HTMLElement} container - Container element
     */
    setLoading(show, container) {
        const overlay = container?.querySelector('.loading-overlay');
        if (overlay) {
            overlay.classList.toggle('visible', show);
        }
        
        const submitBtn = container?.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.disabled = show;
        }
    },
    
    /**
     * Show success animation
     * @param {HTMLElement} formWrapper - Form wrapper element
     * @param {HTMLElement} successWrapper - Success content wrapper
     */
    showSuccess(formWrapper, successWrapper) {
        if (formWrapper) {
            formWrapper.classList.add('hidden');
            setTimeout(() => {
                formWrapper.style.display = 'none';
            }, 300);
        }
        
        if (successWrapper) {
            setTimeout(() => {
                successWrapper.style.display = 'flex';
                successWrapper.classList.add('visible');
            }, 300);
        }
    },
    
    /**
     * Add event listener with automatic cleanup
     * @param {HTMLElement} element - Target element
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     * @returns {Function} Cleanup function
     */
    on(element, event, handler, options = {}) {
        if (!element) return () => {};
        
        element.addEventListener(event, handler, options);
        
        return () => {
            element.removeEventListener(event, handler, options);
        };
    },
    
    /**
     * Delegate event handling
     * @param {HTMLElement} parent - Parent element
     * @param {string} selector - Child selector
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {Function} Cleanup function
     */
    delegate(parent, selector, event, handler) {
        const delegatedHandler = (e) => {
            const target = e.target.closest(selector);
            if (target && parent.contains(target)) {
                handler.call(target, e, target);
            }
        };
        
        return this.on(parent, event, delegatedHandler);
    },
    
    /**
     * Create element with attributes and children
     * @param {string} tag - Tag name
     * @param {Object} attrs - Attributes
     * @param {Array|string} children - Child elements or text
     * @returns {HTMLElement} Created element
     */
    create(tag, attrs = {}, children = []) {
        const element = document.createElement(tag);
        
        for (const [key, value] of Object.entries(attrs)) {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key.startsWith('on') && typeof value === 'function') {
                element.addEventListener(key.slice(2).toLowerCase(), value);
            } else {
                element.setAttribute(key, value);
            }
        }
        
        if (typeof children === 'string') {
            element.textContent = children;
        } else if (Array.isArray(children)) {
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof HTMLElement) {
                    element.appendChild(child);
                }
            });
        }
        
        return element;
    },
    
    /**
     * Fade element in
     * @param {HTMLElement} element - Element to fade in
     * @param {number} duration - Animation duration in ms
     */
    fadeIn(element, duration = 300) {
        if (!element) return;
        
        element.style.opacity = '0';
        element.style.display = '';
        element.style.transition = `opacity ${duration}ms ease`;
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
        });
    },
    
    /**
     * Fade element out
     * @param {HTMLElement} element - Element to fade out
     * @param {number} duration - Animation duration in ms
     */
    fadeOut(element, duration = 300) {
        if (!element) return;
        
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.opacity = '0';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, duration);
    },
    
    /**
     * Show a page-level error banner inside the auth card
     * @param {string} bannerId - Banner element ID
     * @param {string} textId - Text paragraph element ID
     * @param {string} message - Error message to display
     */
    showPageError(bannerId, textId, message) {
        const banner = this.$(bannerId);
        const text = this.$(textId);
        if (text) text.textContent = message;
        if (banner) banner.classList.add('visible');
    },

    /**
     * Hide the page-level error banner
     * @param {string} bannerId - Banner element ID
     */
    clearPageError(bannerId) {
        const banner = this.$(bannerId);
        if (banner) banner.classList.remove('visible');
    },

    /**
     * Get form data as object
     * @param {HTMLFormElement} form - Form element
     * @returns {Object} Form data
     */
    getFormData(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    },
};

// Export for use in other modules
window.DOM = DOM;
