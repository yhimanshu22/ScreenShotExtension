

// This function is wrapped in an IIFE (Immediately Invoked Function Expression)
// to prevent polluting the global scope and to run immediately.
(function () {
    // Prevent the script from running multiple times
    if (window.isScreenshotSelectorActive) return;
    window.isScreenshotSelectorActive = true;

    // --- Create UI Elements ---

    // 1. A semi-transparent overlay to darken the page
    const overlay = document.createElement('div');
    overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0, 0, 0, 0.4); z-index: 9999; cursor: crosshair;
  `;

    // 2. The selection box that the user will draw
    const selectionDiv = document.createElement('div');
    selectionDiv.style.cssText = `
    position: fixed; z-index: 10000; border: 2px dashed #007aff;
    background: rgba(0, 123, 255, 0.2); pointer-events: none;
  `;

    // 3. An instruction message
    const instructions = document.createElement('div');
    instructions.textContent = "Click and drag to select. Press ESC to cancel.";
    instructions.style.cssText = `
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    background: #333; color: white; padding: 10px 20px; border-radius: 5px;
    z-index: 10001; font-family: sans-serif; font-size: 14px;
  `;

    // Add the overlay and instructions to the page
    document.body.appendChild(overlay);
    document.body.appendChild(instructions);

    // --- State Variables ---
    let startX, startY;
    let isSelecting = false;

    // --- Event Handlers ---

    // Start selection on mousedown
    overlay.addEventListener('mousedown', e => {
        e.preventDefault();
        isSelecting = true;
        startX = e.clientX;
        startY = e.clientY;

        // Position the selection box at the starting point
        selectionDiv.style.left = `${startX}px`;
        selectionDiv.style.top = `${startY}px`;
        selectionDiv.style.width = '0px';
        selectionDiv.style.height = '0px';
        document.body.appendChild(selectionDiv);
    });

    // Update selection box on mousemove
    document.addEventListener('mousemove', e => {
        if (!isSelecting) return;
        e.preventDefault();

        // Calculate the dimensions and position of the selection box
        const currentX = e.clientX;
        const currentY = e.clientY;
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);

        // Apply the new dimensions and position
        selectionDiv.style.width = `${width}px`;
        selectionDiv.style.height = `${height}px`;
        selectionDiv.style.left = `${left}px`;
        selectionDiv.style.top = `${top}px`;
    });

    // Finalize selection on mouseup
    overlay.addEventListener('mouseup', e => {
        if (!isSelecting) return;
        e.preventDefault();
        isSelecting = false;

        const rect = selectionDiv.getBoundingClientRect();

        // Only capture if the selection is a meaningful size
        if (rect.width > 10 && rect.height > 10) {
            // Send the coordinates to the background script
            chrome.runtime.sendMessage({
                action: "capture_selected",
                coords: {
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                    devicePixelRatio: window.devicePixelRatio
                }
            });
        }
        // Clean up all UI elements
        cleanup();
    });

    // Handle cancellation with the Escape key
    function handleKeydown(e) {
        if (e.key === "Escape") {
            cleanup();
        }
    }
    document.addEventListener('keydown', handleKeydown);

    // --- Cleanup Function ---
    function cleanup() {
        window.isScreenshotSelectorActive = false;
        document.removeEventListener('keydown', handleKeydown);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (selectionDiv.parentNode) selectionDiv.parentNode.removeChild(selectionDiv);
        if (instructions.parentNode) instructions.parentNode.removeChild(instructions);
    }
})();
