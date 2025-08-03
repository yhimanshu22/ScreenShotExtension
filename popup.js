// Get buttons from the popup's DOM
const captureAreaBtn = document.getElementById('captureAreaBtn');
const captureFullBtn = document.getElementById('captureFullBtn');

// --- Event Listener for "Select Area" ---
captureAreaBtn.addEventListener('click', () => {
    // Disable buttons to prevent multiple clicks
    captureAreaBtn.disabled = true;
    captureFullBtn.disabled = true;
    captureAreaBtn.textContent = 'Selecting...';

    // Query for the active tab to inject the content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['content.js']
        }).then(() => {
            window.close(); // Close popup to allow selection
        }).catch(err => {
            console.error("Failed to inject content script:", err);
            // Re-enable buttons if injection fails
            captureAreaBtn.disabled = false;
            captureFullBtn.disabled = false;
            captureAreaBtn.textContent = 'Select Area to Copy';
        });
    });
});

// --- Event Listener for "Copy Full Page" ---
captureFullBtn.addEventListener('click', () => {
    // Disable buttons to prevent multiple clicks
    captureAreaBtn.disabled = true;
    captureFullBtn.disabled = true;
    captureFullBtn.textContent = 'Capturing...';

    // Send a message to the background script to capture the full page
    chrome.runtime.sendMessage({ action: "capture_full_page" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
        } else if (response && response.success) {
            console.log("Full page capture initiated.");
        }
        // The popup will close automatically after the message is sent
        window.close();
    });
});
