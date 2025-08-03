// Get the capture button from the popup's DOM
const captureAreaBtn = document.getElementById('captureAreaBtn');

// Add a click event listener to the button
captureAreaBtn.addEventListener('click', () => {
    // Disable the button to prevent multiple clicks
    captureAreaBtn.disabled = true;
    captureAreaBtn.textContent = 'Selecting...';

    // Query for the active tab in the current window
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        // Inject the content script into the active tab
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['content.js']
        }).then(() => {
            // Close the popup window to allow the user to see the page
            window.close();
        }).catch(err => {
            console.error("Failed to inject content script:", err);
            // Re-enable the button if injection fails
            captureAreaBtn.disabled = false;
            captureAreaBtn.textContent = 'Select Area to Copy';
        });
    });
});
