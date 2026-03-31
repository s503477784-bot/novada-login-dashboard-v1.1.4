/**
 * =============================================================================
 * Novada Auth System - Success Animation Component
 * =============================================================================
 * Animated success checkmark with optional redirect
 */

const SuccessAnimation = {
    /**
     * Checkmark SVG markup
     */
    checkmarkSvg: `
        <svg class="success-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle class="success-checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="success-checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
        </svg>
    `,
    
    /**
     * Show success animation
     * @param {Object} config - Configuration object
     * @param {HTMLElement} config.formWrapper - Form wrapper to hide
     * @param {HTMLElement} config.successWrapper - Success wrapper to show
     * @param {string} config.title - Success title text
     * @param {string} config.subtitle - Success subtitle text
     * @param {string} config.redirectUrl - URL to redirect to (optional)
     * @param {number} config.redirectDelay - Delay before redirect in seconds
     * @param {Function} config.onComplete - Callback after animation/redirect
     */
    show(config) {
        const {
            formWrapper,
            successWrapper,
            title = 'Success!',
            subtitle = '',
            redirectUrl = null,
            redirectDelay = 3,
            onComplete = null,
        } = config;
        
        // Hide form
        if (formWrapper) {
            formWrapper.classList.add('hidden');
            setTimeout(() => {
                formWrapper.style.display = 'none';
            }, 300);
        }
        
        // Setup success content
        if (successWrapper) {
            // Update content if needed
            const titleEl = successWrapper.querySelector('.success-title');
            const subEl = successWrapper.querySelector('.success-sub');
            
            if (titleEl) {
                titleEl.textContent = title;
            }
            
            if (subEl) {
                if (redirectUrl && redirectDelay > 0) {
                    subEl.textContent = '';
                    subEl.appendChild(document.createTextNode(subtitle));
                    subEl.appendChild(document.createElement('br'));
                    const countdownSpan = document.createElement('span');
                    countdownSpan.className = 'countdown-wrapper';
                    countdownSpan.textContent = 'Redirecting in ';
                    const numSpan = document.createElement('span');
                    numSpan.className = 'countdown-number';
                    numSpan.id = 'countdown';
                    numSpan.textContent = redirectDelay;
                    countdownSpan.appendChild(numSpan);
                    countdownSpan.appendChild(document.createTextNode('s...'));
                    subEl.appendChild(countdownSpan);
                } else {
                    subEl.textContent = subtitle;
                }
            }
            
            // Show success wrapper
            setTimeout(() => {
                successWrapper.style.display = 'flex';
                successWrapper.classList.add('visible');
            }, 300);
        }
        
        // Handle redirect countdown
        if (redirectUrl && redirectDelay > 0) {
            this.startCountdown(redirectDelay, redirectUrl, onComplete);
        } else if (onComplete) {
            setTimeout(onComplete, 1500);
        }
    },
    
    /**
     * Start countdown timer
     * @param {number} seconds - Countdown seconds
     * @param {string} redirectUrl - URL to redirect to
     * @param {Function} onComplete - Callback after redirect
     */
    startCountdown(seconds, redirectUrl, onComplete) {
        let remaining = seconds;
        const countdownEl = DOM.$('countdown');
        
        const interval = setInterval(() => {
            remaining--;
            
            if (countdownEl) {
                countdownEl.textContent = remaining;
            }
            
            if (remaining <= 0) {
                clearInterval(interval);
                
                if (redirectUrl) {
                    if (redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')) {
                        window.location.href = redirectUrl;
                    } else {
                        window.location.href = '/auth/login.html';
                    }
                }
                
                if (onComplete) {
                    onComplete();
                }
            }
        }, 1000);
        
        return interval;
    },
    
    /**
     * Create success wrapper HTML
     * @param {Object} options - Options for the wrapper
     * @returns {string} HTML string
     */
    createWrapper(options = {}) {
        const { id = 'successContent', title = 'Success!', subtitle = '' } = options;

        const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        return `
            <div id="${esc(id)}" class="success-content-wrapper">
                ${this.checkmarkSvg}
                <h2 class="success-title">${esc(title)}</h2>
                <p class="success-sub">${esc(subtitle)}</p>
            </div>
        `;
    },
    
    /**
     * Reset success animation (hide and restore form)
     * @param {HTMLElement} formWrapper - Form wrapper to show
     * @param {HTMLElement} successWrapper - Success wrapper to hide
     */
    reset(formWrapper, successWrapper) {
        if (successWrapper) {
            successWrapper.style.display = 'none';
            successWrapper.classList.remove('visible');
        }
        
        if (formWrapper) {
            formWrapper.style.display = '';
            formWrapper.classList.remove('hidden');
        }
    },
};

// Export for use in other modules
window.SuccessAnimation = SuccessAnimation;
