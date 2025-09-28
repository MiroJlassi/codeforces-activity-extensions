/**
 * GitHub API integration module for AlgoPush extension
 */

window.GitHubAPI = class GitHubAPI {
    constructor() {
        this.config = null;
        this.rateLimitRemaining = null;
        this.rateLimitReset = null;
    }

    /**
     * Get GitHub configuration from storage
     * @returns {Promise<Object>} GitHub configuration
     */
    async getConfig() {
        return new Promise((resolve) => {
            chrome.storage.local.get(["token", "owner", "repo", "branch"], (data) => {
                const config = {
                    token: data.token,
                    owner: data.owner,
                    repo: data.repo,
                    branch: data.branch || window.CONFIG?.DEFAULT_BRANCH || 'main'
                };
                this.config = config;
                resolve(config);
            });
        });
    }

    /**
     * Validate GitHub configuration
     * @returns {Promise<Object>} Validation result
     */
    async validateConfig() {
        const config = await this.getConfig();
        return window.validateGitHubConfig(config);
    }

    /**
     * Make authenticated request to GitHub API
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<Object>} API response
     */
    async makeRequest(endpoint, options = {}) {
        if (!this.config) {
            await this.getConfig();
        }

        const url = endpoint.startsWith('http') ? endpoint : `${window.CONFIG?.GITHUB_API_BASE || 'https://api.github.com'}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Authorization': `token ${this.config.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: { ...defaultOptions.headers, ...options.headers }
        };

        try {
            const response = await fetch(url, mergedOptions);
            
            // Update rate limit info
            this.rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
            this.rateLimitReset = response.headers.get('X-RateLimit-Reset');

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('GitHub API request failed:', error);
            throw new Error(window.formatErrorMessage(error));
        }
    }

    /**
     * Get the latest commit SHA for a branch
     * @param {string} branch - Branch name
     * @returns {Promise<string>} Commit SHA
     */
    async getLatestCommitSha(branch = null) {
        const targetBranch = branch || this.config.branch;
        const endpoint = `/repos/${this.config.owner}/${this.config.repo}/git/refs/heads/${targetBranch}`;
        
        const ref = await this.makeRequest(endpoint);
        if (!ref.object || !ref.object.sha) {
            throw new Error('Could not get latest commit SHA');
        }
        
        return ref.object.sha;
    }

    /**
     * Get commit details
     * @param {string} sha - Commit SHA
     * @returns {Promise<Object>} Commit details
     */
    async getCommit(sha) {
        const endpoint = `/repos/${this.config.owner}/${this.config.repo}/git/commits/${sha}`;
        return await this.makeRequest(endpoint);
    }

    /**
     * Create a blob
     * @param {string} content - File content
     * @returns {Promise<string>} Blob SHA
     */
    async createBlob(content) {
        const endpoint = `/repos/${this.config.owner}/${this.config.repo}/git/blobs`;
        
        const response = await this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify({
                content: btoa(unescape(encodeURIComponent(content))), // Handle Unicode properly
                encoding: 'base64'
            })
        });

        if (!response.sha) {
            throw new Error('Blob creation failed');
        }

        return response.sha;
    }

    /**
     * Create a tree
     * @param {string} baseTreeSha - Base tree SHA
     * @param {Array} files - Array of file objects
     * @returns {Promise<string>} Tree SHA
     */
    async createTree(baseTreeSha, files) {
        const endpoint = `/repos/${this.config.owner}/${this.config.repo}/git/trees`;
        
        const tree = files.map(file => ({
            path: file.path,
            mode: '100644',
            type: 'blob',
            sha: file.blobSha
        }));

        const response = await this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify({
                base_tree: baseTreeSha,
                tree: tree
            })
        });

        if (!response.sha) {
            throw new Error('Tree creation failed');
        }

        return response.sha;
    }

    /**
     * Create a commit
     * @param {string} message - Commit message
     * @param {string} treeSha - Tree SHA
     * @param {Array} parentShas - Parent commit SHAs
     * @returns {Promise<string>} Commit SHA
     */
    async createCommit(message, treeSha, parentShas) {
        const endpoint = `/repos/${this.config.owner}/${this.config.repo}/git/commits`;
        
        const response = await this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify({
                message: message,
                tree: treeSha,
                parents: parentShas
            })
        });

        if (!response.sha) {
            throw new Error('Commit creation failed');
        }

        return response.sha;
    }

    /**
     * Update reference (branch)
     * @param {string} branch - Branch name
     * @param {string} commitSha - Commit SHA
     * @returns {Promise<void>}
     */
    async updateRef(branch, commitSha) {
        const endpoint = `/repos/${this.config.owner}/${this.config.repo}/git/refs/heads/${branch}`;
        
        await this.makeRequest(endpoint, {
            method: 'PATCH',
            body: JSON.stringify({
                sha: commitSha
            })
        });
    }

    /**
     * Generate file path based on problem details
     * @param {string} filename - Original filename
     * @returns {string} Generated file path
     */
    generateFilePath(filename) {
        const details = window.getProblemDetails();
        if (!details) {
            throw new Error('Could not get problem details');
        }

        const fileExtension = window.getFileExtension(filename);
        const safeName = `${details.problemName}.${fileExtension}`;
        return `${details.contestId}/${safeName}`;
    }

    /**
     * Push solution to GitHub
     * @param {string} content - File content
     * @param {string} filename - Original filename
     * @returns {Promise<void>}
     */
    async pushSolution(content, filename) {
        try {
            // Validate configuration
            const validation = await this.validateConfig();
            if (!validation.isValid) {
                throw new Error(`Configuration invalid: ${validation.errors.join(', ')}`);
            }

            const filePath = this.generateFilePath(filename);
            console.log('📁 GitHub path:', filePath);
            console.log('📌 GitHub repo:', `${this.config.owner}/${this.config.repo} on branch ${this.config.branch}`);

            window.showInfo('🚀 Pushing solution to GitHub...', 3000);

            // Get latest commit SHA
            const latestCommitSha = await this.getLatestCommitSha();
            
            // Get commit details for tree SHA
            const commit = await this.getCommit(latestCommitSha);
            const baseTreeSha = commit.tree.sha;

            // Create blob
            const blobSha = await this.createBlob(content);

            // Create tree
            const treeSha = await this.createTree(baseTreeSha, [{
                path: filePath,
                blobSha: blobSha
            }]);

            // Create commit
            const commitMessage = this.generateCommitMessage(filePath);
            const newCommitSha = await this.createCommit(commitMessage, treeSha, [latestCommitSha]);

            // Update reference
            await this.updateRef(this.config.branch, newCommitSha);

            const successMessage = `✅ Solution pushed successfully 🚀`;
            window.showSuccess(successMessage, 4000);
            
            console.log('✅ Push complete:', filePath);
            
        } catch (error) {
            console.error('❌ GitHub push failed:', error);
            window.showError(`❌ GitHub push failed: ${window.formatErrorMessage(error)}`, 5000);
            throw error;
        }
    }

    /**
     * Generate commit message
     * @param {string} filePath - File path
     * @returns {string} Commit message
     */
    generateCommitMessage(filePath) {
        const details = window.getProblemDetails();
        const timestamp = new Date().toISOString();
        
        if (details) {
            return `🚀✨ Solved: ${details.contestId} - Problem ${details.problemIndex} (${details.problemName}) | ${timestamp}`;
        } else {
            return `🚀✨ Epic Solution uploaded: ${filePath} | ${timestamp}`;
        }
    }

    /**
     * Test GitHub connection
     * @returns {Promise<Object>} Connection test result
     */
    async testConnection() {
        try {
            const validation = await this.validateConfig();
            if (!validation.isValid) {
                return { success: false, error: validation.errors.join(', ') };
            }

            // Test by getting repo info
            const endpoint = `/repos/${this.config.owner}/${this.config.repo}`;
            const repoInfo = await this.makeRequest(endpoint);

            return { 
                success: true, 
                data: {
                    name: repoInfo.name,
                    fullName: repoInfo.full_name,
                    private: repoInfo.private,
                    defaultBranch: repoInfo.default_branch
                }
            };
        } catch (error) {
            return { success: false, error: window.formatErrorMessage(error) };
        }
    }

    /**
     * Get rate limit status
     * @returns {Object} Rate limit info
     */
    getRateLimit() {
        return {
            remaining: this.rateLimitRemaining,
            reset: this.rateLimitReset ? new Date(this.rateLimitReset * 1000) : null
        };
    }
};