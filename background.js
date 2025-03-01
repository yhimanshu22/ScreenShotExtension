chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received message in background:", message);

    if (message.action === "capture_screenshot") {
        chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {

            if (chrome.runtime.lastError) {
                console.error("Screenshot Error:", chrome.runtime.lastError);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                console.log("Screenshot captured:", dataUrl);
                sendResponse({ success: true, image: dataUrl });
            }

        });
        return true;  // 👈 Keeps sendResponse alive for async function
    }
});


