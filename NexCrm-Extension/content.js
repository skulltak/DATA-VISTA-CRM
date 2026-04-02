// Content Script for Data Vista CRM
// Relays messages between the web page and the background service worker

window.addEventListener('message', (event) => {
    // Only accept messages from the same window
    if (event.source !== window) return;

    const data = event.data;
    if (data && data.type === 'DATA_VISTA_SYNC_REQUEST') {
        console.log('Tactical Sync Relay: Received request for', data.records.length, 'records.');
        
        // Forward to background script
        chrome.runtime.sendMessage(data, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error forwarding sync request:', chrome.runtime.lastError);
            } else {
                console.log('Tactical Sync Relay: Background acknowledgment received.');
            }
        });
    }
});
