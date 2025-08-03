// This script runs in the offscreen document.

// Listen for the message from the background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'crop_and_copy') {
    cropImageAndSendToBackground(message.dataUrl, message.coords);
  }
});

// The main function to perform cropping and send the result back
async function cropImageAndSendToBackground(dataUrl, coords) {
  try {
    const img = new Image();
    img.onload = async () => {
      try {
        const canvas = new OffscreenCanvas(coords.width, coords.height);
        const ctx = canvas.getContext('2d');

        // Draw the cropped portion of the image onto the canvas
        ctx.drawImage(
          img,
          coords.x * coords.devicePixelRatio,
          coords.y * coords.devicePixelRatio,
          coords.width * coords.devicePixelRatio,
          coords.height * coords.devicePixelRatio,
          0, 0,
          coords.width,
          coords.height
        );

        // Get the result as a blob, then convert to a data URL
        const blob = await canvas.convertToBlob({ type: 'image/png' });
        const reader = new FileReader();
        reader.onload = () => {
          // Send the final data URL back to the background script
          chrome.runtime.sendMessage({
            action: "offscreen_crop_complete",
            dataUrl: reader.result
          });
        };
        reader.readAsDataURL(blob);

      } catch (error) {
        console.error("ERROR during canvas operation:", error);
      }
    };
    img.onerror = () => {
      console.error("ERROR: The image failed to load in the offscreen document.");
    };
    img.src = dataUrl;
  } catch (e) {
    console.error("ERROR in the main cropImageAndSendToBackground function:", e);
  }
}
