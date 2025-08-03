const OFFSCREEN_DOCUMENT_PATH = '/offscreen.html';

// Listen for messages from content script, popup, or offscreen document
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    // 1. Message from content script with coordinates to start the process
    if (message.action === "capture_selected") {
        try {
            const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: "png" });
            await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);
            chrome.runtime.sendMessage({
                action: 'crop_and_copy',
                dataUrl: dataUrl,
                coords: message.coords
            });
        } catch (error) {
            console.error("Failed to capture tab. It might be a protected page (e.g., chrome://).", error);
        }
    }

    // --- NEW: Handle full-page capture request from the popup ---
    if (message.action === "capture_full_page") {
        try {
            const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: "png" });
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            // Inject the copy function directly, since no cropping is needed
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: copyImageToClipboard,
                args: [dataUrl]
            });
            sendResponse({ success: true });
        } catch (error) {
            console.error("Failed to capture full page. It might be a protected page.", error);
            sendResponse({ success: false, error: error.message });
        }
        return true; // Keep message channel open for async response
    }

    // 2. Message from offscreen document with the final cropped image
    if (message.action === "offscreen_crop_complete") {
        if (message.dataUrl) {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: copyImageToClipboard,
                args: [message.dataUrl]
            });
        }
    }
});

// This function will be injected into the active, focused webpage.
// It receives an image as a data URL and writes it to the clipboard.
async function copyImageToClipboard(dataUrl) {
    try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
        ]);
        console.log('SUCCESS: Image copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy image in the content script:', err);
    }
}

// A helper function to create and manage the offscreen document
async function setupOffscreenDocument(path) {
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT']
    });
    if (existingContexts.length > 0) {
        return;
    }
    await chrome.offscreen.createDocument({
        url: path,
        reasons: ['CLIPBOARD'],
        justification: 'Required to crop an image on a canvas element.',
    });
}
