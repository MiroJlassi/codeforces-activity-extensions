/**
 * AlgoPush Background Service Worker
 * Handles extension lifecycle and background tasks
 */

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
    console.log('AlgoPush installed/updated:', details.reason);
    
    if (details.reason === 'install') {
        // Set default configuration
        chrome.storage.local.set({
            branch: 'main',
            firstRun: true
        });
        
        console.log('AlgoPush: First installation completed');
    } else if (details.reason === 'update') {
        console.log('AlgoPush: Extension updated to version', chrome.runtime.getManifest().version);
    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('AlgoPush: Extension started');
});

// Handle tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Only inject on Codeforces pages when the page is complete
    if (changeInfo.status === 'complete' && 
        tab.url && 
        (tab.url.includes('codeforces.com/problemset/problem') || 
         tab.url.includes('codeforces.com/contest'))) {
        
        console.log('AlgoPush: Codeforces page detected, content script should be active');
    }
});

// Handle storage changes for debugging
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        console.log('AlgoPush: Storage changed:', changes);
    }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('AlgoPush: Message received:', message);
    
    switch (message.type) {
        case 'GET_VERSION':
            sendResponse({ version: chrome.runtime.getManifest().version });
            break;
            
        case 'LOG_ERROR':
            console.error('AlgoPush Error:', message.error);
            break;
            
        case 'LOG_SUCCESS':
            console.log('AlgoPush Success:', message.message);
            break;
            
        default:
            console.log('AlgoPush: Unknown message type:', message.type);
    }
    
    return true; // Keep message channel open for async responses
});

// Error handling
self.addEventListener('error', (event) => {
    console.error('AlgoPush Background Error:', event.error);
});

console.log('AlgoPush Background Service Worker loaded');