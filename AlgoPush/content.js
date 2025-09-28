/**
 * AlgoPush Chrome Extension - Main Content Script
 * Automatically pushes Codeforces solutions to GitHub
 */

// Since Chrome extensions don't support ES6 modules in content scripts,
// we'll use the global objects created by the other scripts

class AlgoPushManager {
    constructor() {
        this.fileHandler = new window.FileHandler();
        this.githubAPI = new window.GitHubAPI();
        this.isProcessing = false;
        this.init();
    }

    async init() {
        try {
            await this.waitForPageLoad();
            await this.waitForDependencies();
            this.setupEventListeners();
            this.setupFileHandler();
            console.log('🚀 AlgoPush initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AlgoPush:', error);
            window.showError(`Failed to initialize: ${window.formatErrorMessage(error)}`);
        }
    }

    async waitForPageLoad() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve);
            }
        });
    }

    async waitForDependencies() {
        // Wait for all dependencies to be loaded
        const maxWait = 5000; // 5 seconds
        const checkInterval = 100; // 100ms
        let waited = 0;

        return new Promise((resolve, reject) => {
            const checkDependencies = () => {
                if (window.FileHandler && window.GitHubAPI && window.showInfo && window.formatErrorMessage) {
                    resolve();
                    return;
                }

                waited += checkInterval;
                if (waited >= maxWait) {
                    reject(new Error('Dependencies failed to load'));
                    return;
                }

                setTimeout(checkDependencies, checkInterval);
            };

            checkDependencies();
        });
    }

    setupEventListeners() {
        const submitButton = document.querySelector(window.SELECTORS?.SUBMIT_BUTTON || "#sidebarSubmitButton");
        if (!submitButton) {
            console.warn('Submit button not found, AlgoPush may not work on this page');
            return;
        }

        submitButton.addEventListener('click', this.handleSubmit.bind(this));
        console.log('Submit button listener attached');
    }

    setupFileHandler() {
        const fileInput = document.querySelector(window.SELECTORS?.FILE_INPUT || "input[name='sourceFile']");
        if (!fileInput) {
            console.warn('File input not found, AlgoPush may not work on this page');
            return;
        }

        this.fileHandler.init(fileInput);

        // Set up file handler callbacks
        this.fileHandler.on('onFileSelected', (fileInfo) => {
            console.log('File selected:', fileInfo);
            this.onFileSelected(fileInfo);
        });

        this.fileHandler.on('onFileError', (error) => {
            console.error('File error:', error);
            window.showError(`File error: ${error}`);
        });

        console.log('File handler initialized');
    }

    onFileSelected(fileInfo) {
        window.showSuccess(`📄 File ready: ${fileInfo.sanitizedName} (${fileInfo.formattedSize})`);
        this.displayFileInfo(fileInfo);
    }

    displayFileInfo(fileInfo) {
        // Create or update file info display
        let infoDisplay = document.getElementById('algopush-file-info');
        if (!infoDisplay) {
            infoDisplay = this.createFileInfoDisplay();
        }

        infoDisplay.innerHTML = `
            <div class="file-info-content">
                <div class="file-icon">📄</div>
                <div class="file-details">
                    <div class="file-name">${fileInfo.sanitizedName}</div>
                    <div class="file-meta">${fileInfo.formattedSize} • ${fileInfo.type}</div>
                </div>
                <div class="file-status">✅</div>
            </div>
        `;
    }

    createFileInfoDisplay() {
        const display = document.createElement('div');
        display.id = 'algopush-file-info';
        display.className = 'algopush-file-info';
        
        // Add styles
        if (!document.getElementById('algopush-file-info-styles')) {
            this.injectFileInfoStyles();
        }

        // Insert after file input
        const fileInput = document.querySelector(window.SELECTORS?.FILE_INPUT || "input[name='sourceFile']");
        if (fileInput && fileInput.parentNode) {
            fileInput.parentNode.insertBefore(display, fileInput.nextSibling);
        }

        return display;
    }

    injectFileInfoStyles() {
        const style = document.createElement('style');
        style.id = 'algopush-file-info-styles';
        style.textContent = `
            .algopush-file-info {
                margin: 10px 0;
                padding: 12px;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                border-radius: 8px;
                border: 1px solid #e1e8ed;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .file-info-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .file-icon {
                font-size: 24px;
                opacity: 0.8;
            }

            .file-details {
                flex: 1;
            }

            .file-name {
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 2px;
            }

            .file-meta {
                font-size: 12px;
                color: #7f8c8d;
            }

            .file-status {
                font-size: 18px;
            }
        `;
        document.head.appendChild(style);
    }

    async handleSubmit(event) {
        event.preventDefault();

        if (this.isProcessing) {
            window.showInfo('Already processing, please wait...', 2000);
            return;
        }

        if (!this.fileHandler.hasFile()) {
            // Let the original form submission happen
            return;
        }

        this.isProcessing = true;

        try {
            // Test GitHub connection first
            window.showInfo('🔄 Testing GitHub connection...', 2000);
            const connectionTest = await this.githubAPI.testConnection();
            
            if (!connectionTest.success) {
                throw new Error(`GitHub connection failed: ${connectionTest.error}`);
            }

            window.showSuccess('✅ GitHub connection verified', 1500);

            // Read file content
            window.showInfo('📖 Reading file content...', 1500);
            const content = await this.fileHandler.readFileContent();
            
            if (!content.trim()) {
                throw new Error('File is empty');
            }

            // Push to GitHub
            const fileInfo = this.fileHandler.getFileInfo();
            await this.githubAPI.pushSolution(content, fileInfo.name);

            // Submit the form
            console.log('✅ Push complete. Submitting form...');
            window.showSuccess('✅ Push complete! Submitting...', 2000);
            
            // Small delay to show success message
            setTimeout(() => {
                event.target.closest('form').submit();
            }, 1000);

        } catch (error) {
            console.error('AlgoPush failed:', error);
            window.showError(`AlgoPush failed: ${window.formatErrorMessage(error)}`, 5000);
            
            // Still submit the form even if GitHub push fails
            setTimeout(() => {
                event.target.closest('form').submit();
            }, 2000);
        } finally {
            this.isProcessing = false;
        }
    }

    // Public methods for debugging
    getFileInfo() {
        return this.fileHandler.getFileInfo();
    }

    async testGitHub() {
        return await this.githubAPI.testConnection();
    }

    getRateLimit() {
        return this.githubAPI.getRateLimit();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.algoPush = new AlgoPushManager();
    });
} else {
    window.algoPush = new AlgoPushManager();
}

// Global error handler
window.addEventListener('error', (event) => {
    if (event.error && event.error.message && event.error.message.includes('AlgoPush')) {
        console.error('AlgoPush global error:', event.error);
        if (window.showError) {
            window.showError('AlgoPush encountered an error. Check console for details.', 3000);
        }
    }
});

console.log('AlgoPush content script loaded');
