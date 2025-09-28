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

window.getContestId = function() {
    const match = window.location.pathname.match(/\b\d{4}\b/);
    return match ? match[0] : "unknown_contest";
};

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

window.getFileExtension = function(filename) {
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop() : "txt";
};

window.sanitizeFilename = function(filename) {
    return filename.replace(/[^\w\-\.]/g, "_");
};

window.delay = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

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

window.formatErrorMessage = function(error) {
    if (error.message) return error.message;
    if (typeof error === 'string') return error;
    return 'An unknown error occurred';
};