/**
 * Toast notification system for AlgoPush extension
 */

class ToastSystem {
    constructor() {
        this.container = null;
        this.stylesInjected = false;
        this.init();
    }

    init() {
        this.injectStyles();
        this.createContainer();
    }

    injectStyles() {
        if (this.stylesInjected || document.getElementById("algopush-toast-style")) return;

        const style = document.createElement("style");
        style.id = "algopush-toast-style";
        style.textContent = `
            .algopush-toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                min-width: 250px;
                max-width: 400px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 16px 20px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                font-weight: 500;
                line-height: 1.4;
                z-index: 10000;
                opacity: 0;
                transform: translateY(30px) scale(0.9);
                transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .algopush-toast.show {
                opacity: 1;
                transform: translateY(0) scale(1);
            }

            .algopush-toast.success {
                background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            }

            .algopush-toast.error {
                background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
            }

            .algopush-toast.info {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }

            .algopush-toast.warning {
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            }

            .algopush-toast-icon {
                display: inline-block;
                margin-right: 8px;
                font-size: 16px;
            }

            .algopush-toast-content {
                display: inline-block;
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            .algopush-toast-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            }

            .algopush-toast-container .algopush-toast {
                position: relative;
                bottom: auto;
                right: auto;
                margin-bottom: 10px;
                pointer-events: auto;
            }
        `;
        document.head.appendChild(style);
        this.stylesInjected = true;
    }

    createContainer() {
        if (this.container) return;

        this.container = document.createElement("div");
        this.container.className = "algopush-toast-container";
        document.body.appendChild(this.container);
    }

    /**
     * Shows a toast notification
     * @param {string} message - The message to display
     * @param {string} type - Toast type: 'success', 'error', 'info', 'warning'
     * @param {number} duration - Duration in milliseconds
     */
    async show(message, type = 'info', duration = window.CONFIG?.TOAST_DURATION?.MEDIUM || 3000) {
        const toast = this.createToast(message, type);
        this.container.appendChild(toast);

        // Animate in
        await window.delay(50);
        toast.classList.add("show");

        // Auto-remove after duration
        setTimeout(async () => {
            await this.hide(toast);
        }, duration);

        return toast;
    }

    createToast(message, type) {
        const toast = document.createElement("div");
        toast.className = `algopush-toast ${type}`;
        
        const icon = this.getIconForType(type);
        toast.innerHTML = `
            <span class="algopush-toast-icon">${icon}</span>
            <span class="algopush-toast-content">${message}</span>
        `;

        return toast;
    }

    async hide(toast) {
        toast.classList.remove("show");
        await window.delay(400); // Wait for animation
        if (toast.parentNode) {
            toast.remove();
        }
    }

    getIconForType(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: '📘'
        };
        return icons[type] || icons.info;
    }

    // Convenience methods
    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration || window.CONFIG?.TOAST_DURATION?.ERROR || 5000);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// Create singleton instance
const toastSystem = new ToastSystem();

// Export convenience functions globally
window.showToast = (message, type, duration) => toastSystem.show(message, type, duration);
window.showSuccess = (message, duration) => toastSystem.success(message, duration);
window.showError = (message, duration) => toastSystem.error(message, duration);
window.showWarning = (message, duration) => toastSystem.warning(message, duration);
window.showInfo = (message, duration) => toastSystem.info(message, duration);

window.ToastSystem = ToastSystem;