/**
 * Utility functions and constants for AlgoPush extension
 */

// Constants
window.CONFIG = {
    TOAST_DURATION: {
        SHORT: 2000,
        MEDIUM: 3000,
        LONG: 4000,
        ERROR: 5000
    },
    GITHUB_API_BASE: 'https://api.github.com',
    DEFAULT_BRANCH: 'main'
};

window.SELECTORS = {
    FILE_INPUT: "input[name='sourceFile']",
    SUBMIT_BUTTON: "#sidebarSubmitButton",
    PROBLEM_TITLE: ".problem-statement .title"
};

/**
 * Extracts contest ID from the current URL
 * @returns {string} Contest ID or 'unknown_contest'
 */
window.getContestId = function() {
    const match = window.location.pathname.match(/\b\d{4}\b/);
    return match ? match[0] : "unknown_contest";
};

/**
 * Extracts problem details from the current page
 * @returns {Object|null} Problem details or null if extraction fails
 */
window.getProblemDetails = function() {
    try {
        const contestId = window.getContestId();
        const urlParts = window.location.pathname.split("/");
        const problemIndex = urlParts[4] || "X";

        const problemNameElement = document.querySelector(window.SELECTORS.PROBLEM_TITLE);
        let problemName = problemNameElement ? 
            problemNameElement.textContent.trim() : "problem";

        problemName = problemName.replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
        return { contestId, problemIndex, problemName };
    } catch (e) {
        console.error("Failed to get problem details:", e);
        return null;
    }
};

/**
 * Gets file extension from filename
 * @param {string} filename - The filename
 * @returns {string} File extension or 'txt'
 */
window.getFileExtension = function(filename) {
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop() : "txt";
};

/**
 * Sanitizes filename for safe usage
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
window.sanitizeFilename = function(filename) {
    return filename.replace(/[^\w\-\.]/g, "_");
};

/**
 * Creates a delay promise
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
window.delay = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Validates GitHub configuration
 * @param {Object} config - GitHub configuration
 * @returns {Object} Validation result
 */
window.validateGitHubConfig = function(config) {
    const errors = [];
    
    if (!config.token) errors.push("GitHub token is required");
    if (!config.owner) errors.push("GitHub username is required");
    if (!config.repo) errors.push("Repository name is required");
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Formats error message for display
 * @param {Error} error - Error object
 * @returns {string} Formatted error message
 */
window.formatErrorMessage = function(error) {
    if (error.message) return error.message;
    if (typeof error === 'string') return error;
    return 'An unknown error occurred';
};