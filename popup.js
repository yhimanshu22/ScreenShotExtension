document.getElementById("captureFull").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "capture_screenshot" }, (response) => {
        if (response && response.success) {
            displayImage(response.image);
            copyToClipboard(response.image);
        } else {
            console.error("Screenshot failed:", response.error);
        }
    });
});

document.getElementById("captureSelected").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ["content.js"]

        });
    });
});

// Display screenshot in popup
function displayImage(imageUrl) {
    const imgElement = document.getElementById("screenshot");
    imgElement.src = imageUrl;
    imgElement.style.display = "block";
}

// Copy image to clipboard
function copyToClipboard(imageUrl) {
    fetch(imageUrl)
        .then(res => res.blob())
        .then(blob => navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]))
        .then(() => console.log("Image copied to clipboard!"))
        .catch(err => console.error("Clipboard copy failed:", err));
}


