class AlgoPushPopup {
    constructor() {
        this.elements = {};
        this.config = {};
        this.isLoading = false;
        this.init();
    }

    async init() {
        this.setupElements();
        this.setupEventListeners();
        await this.loadConfiguration();
        this.updateUI();
    }

    setupElements() {
        this.elements = {
            tokenInput: document.getElementById('token'),
            ownerInput: document.getElementById('owner'),
            repoInput: document.getElementById('repo'),
            branchInput: document.getElementById('branch'),
            
            saveButton: document.getElementById('saveButton'),
            clearButton: document.getElementById('clearButton'),
            testButton: document.getElementById('testButton'),
            toggleToken: document.getElementById('toggleToken'),
            
            statusCard: document.getElementById('statusCard'),
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText'),
            
            configForm: document.getElementById('configForm'),
            toastContainer: document.getElementById('toastContainer')
        };
    }

    setupEventListeners() {
        this.elements.configForm.addEventListener('submit', this.handleSave.bind(this));
        
        this.elements.clearButton.addEventListener('click', this.handleClear.bind(this));
        this.elements.testButton.addEventListener('click', this.handleTest.bind(this));
        this.elements.toggleToken.addEventListener('click', this.toggleTokenVisibility.bind(this));
        
        [this.elements.tokenInput, this.elements.ownerInput, this.elements.repoInput]
            .forEach(input => {
                input.addEventListener('input', this.validateForm.bind(this));
                input.addEventListener('blur', this.validateForm.bind(this));
            });

        this.elements.tokenInput.addEventListener('input', this.validateToken.bind(this));
        this.elements.ownerInput.addEventListener('input', this.validateOwner.bind(this));
        this.elements.repoInput.addEventListener('input', this.validateRepo.bind(this));

        [this.elements.tokenInput, this.elements.ownerInput, this.elements.repoInput, this.elements.branchInput]
            .forEach(input => {
                input.addEventListener('blur', this.autoSave.bind(this));
            });
    }

    async loadConfiguration() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['token', 'owner', 'repo', 'branch'], (data) => {
                this.config = {
                    token: data.token || '',
                    owner: data.owner || '',
                    repo: data.repo || '',
                    branch: data.branch || 'main'
                };
                
                this.elements.tokenInput.value = this.config.token;
                this.elements.ownerInput.value = this.config.owner;
                this.elements.repoInput.value = this.config.repo;
                this.elements.branchInput.value = this.config.branch;
                
                resolve();
            });
        });
    }

    updateUI() {
        this.validateForm();
        this.updateConnectionStatus();
    }

    validateForm() {
        const isValid = this.isConfigurationValid();
        
        this.elements.saveButton.disabled = !isValid;
        this.elements.testButton.disabled = !isValid;
        
        this.updateInputStates();
        
        return isValid;
    }

    updateInputStates() {
        const inputs = [
            { element: this.elements.tokenInput, validator: this.validateToken },
            { element: this.elements.ownerInput, validator: this.validateOwner },
            { element: this.elements.repoInput, validator: this.validateRepo }
        ];

        inputs.forEach(({ element, validator }) => {
            const isValid = validator.call(this, element.value);
            element.classList.toggle('invalid', !isValid && element.value.length > 0);
            element.classList.toggle('valid', isValid);
        });
    }

    validateToken(value = this.elements.tokenInput.value) {
        const tokenRegex = /^gh[pous]_[A-Za-z0-9_]{36,255}$/;
        return tokenRegex.test(value);
    }

    validateOwner(value = this.elements.ownerInput.value) {
        const usernameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
        return usernameRegex.test(value);
    }

    validateRepo(value = this.elements.repoInput.value) {
        const repoRegex = /^[a-zA-Z0-9._-]+$/;
        return value.length > 0 && value.length <= 100 && repoRegex.test(value);
    }

    isConfigurationValid() {
        return this.validateToken() && this.validateOwner() && this.validateRepo();
    }

    updateConnectionStatus() {
        const hasConfig = this.isConfigurationValid();
        
        if (!hasConfig) {
            this.setConnectionStatus('not-configured', 'Not configured');
        } else {
            this.setConnectionStatus('configured', 'Ready to test');
        }
    }

    setConnectionStatus(type, message) {
        this.elements.statusCard.className = 'status-card';
        
        if (type === 'connected') {
            this.elements.statusCard.classList.add('connected');
        } else if (type === 'error') {
            this.elements.statusCard.classList.add('error');
        }
        
        this.elements.statusText.textContent = message;
    }

    async handleSave(event) {
        event.preventDefault();
        
        if (this.isLoading) return;
        
        if (!this.validateForm()) {
            this.showToast('Please fill in all required fields correctly', 'error');
            return;
        }

        this.setLoading(this.elements.saveButton, true);

        try {
            const newConfig = {
                token: this.elements.tokenInput.value.trim(),
                owner: this.elements.ownerInput.value.trim(),
                repo: this.elements.repoInput.value.trim(),
                branch: this.elements.branchInput.value.trim() || 'main'
            };

            await this.saveConfiguration(newConfig);
            this.config = newConfig;
            
            this.showToast('✅ Configuration saved successfully!', 'success');
            this.updateConnectionStatus();
            
        } catch (error) {
            console.error('Save failed:', error);
            this.showToast('❌ Failed to save configuration', 'error');
        } finally {
            this.setLoading(this.elements.saveButton, false);
        }
    }

    async handleClear() {
        if (this.isLoading) return;
        
        if (!confirm('Are you sure you want to clear all configuration?')) {
            return;
        }

        try {
            await chrome.storage.local.clear();
            
            // Clear form fields
            this.elements.tokenInput.value = '';
            this.elements.ownerInput.value = '';
            this.elements.repoInput.value = '';
            this.elements.branchInput.value = 'main';
            
            this.config = { token: '', owner: '', repo: '', branch: 'main' };
            this.updateUI();
            
            this.showToast('🗑️ Configuration cleared', 'success');
            
        } catch (error) {
            console.error('Clear failed:', error);
            this.showToast('❌ Failed to clear configuration', 'error');
        }
    }

    async handleTest() {
        if (this.isLoading || !this.validateForm()) return;
        
        this.setLoading(this.elements.testButton, true);
        this.setConnectionStatus('testing', 'Testing connection...');

        try {
            const config = {
                token: this.elements.tokenInput.value.trim(),
                owner: this.elements.ownerInput.value.trim(),
                repo: this.elements.repoInput.value.trim(),
                branch: this.elements.branchInput.value.trim() || 'main'
            };

            const result = await this.testGitHubConnection(config);
            
            if (result.success) {
                this.setConnectionStatus('connected', `✅ Connected to ${result.data.fullName}`);
                this.showToast('✅ GitHub connection successful!', 'success');
            } else {
                this.setConnectionStatus('error', '❌ Connection failed');
                this.showToast(`❌ Connection failed: ${result.error}`, 'error');
            }
            
        } catch (error) {
            console.error('Test failed:', error);
            this.setConnectionStatus('error', '❌ Connection failed');
            this.showToast(`❌ Test failed: ${error.message}`, 'error');
        } finally {
            this.setLoading(this.elements.testButton, false);
        }
    }

    async testGitHubConnection(config) {
        const url = `https://api.github.com/repos/${config.owner}/${config.repo}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${config.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const repoData = await response.json();
        
        return {
            success: true,
            data: {
                name: repoData.name,
                fullName: repoData.full_name,
                private: repoData.private,
                defaultBranch: repoData.default_branch
            }
        };
    }

    toggleTokenVisibility() {
        const isPassword = this.elements.tokenInput.type === 'password';
        this.elements.tokenInput.type = isPassword ? 'text' : 'password';
        
        const icon = this.elements.toggleToken.querySelector('.eye-icon');
        icon.style.opacity = isPassword ? '0.7' : '1';
    }

    async autoSave() {
        if (!this.validateForm()) return;
        
        try {
            const currentConfig = {
                token: this.elements.tokenInput.value.trim(),
                owner: this.elements.ownerInput.value.trim(),
                repo: this.elements.repoInput.value.trim(),
                branch: this.elements.branchInput.value.trim() || 'main'
            };

            if (JSON.stringify(currentConfig) !== JSON.stringify(this.config)) {
                await this.saveConfiguration(currentConfig);
                this.config = currentConfig;
            }
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }

    async saveConfiguration(config) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set(config, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        });
    }

    setLoading(button, loading) {
        this.isLoading = loading;
        
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
        
        if (!loading) {
            this.validateForm();
        }
    }

    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        this.elements.toastContainer.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.algoPushPopup = new AlgoPushPopup();
});

const validationStyles = document.createElement('style');
validationStyles.textContent = `
    .input-field.invalid {
        border-color: #ef4444 !important;
        background-color: #fef2f2 !important;
    }
    
    .input-field.valid {
        border-color: #10b981 !important;
        background-color: #f0fdfa !important;
    }
    
    .input-field.invalid:focus {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
    }
    
    .input-field.valid:focus {
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
    }

    @media (prefers-color-scheme: dark) {
        .input-field.invalid {
            background-color: #1f2937 !important;
        }
        
        .input-field.valid {
            background-color: #064e3b !important;
        }
    }
`;

document.head.appendChild(validationStyles);
