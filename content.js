(async function () {
    // Create a selection overlay
    let selectionDiv = document.createElement("div");
    selectionDiv.style.position = "fixed";
    selectionDiv.style.zIndex = "10000";
    selectionDiv.style.border = "2px dashed red";
    selectionDiv.style.background = "rgba(255, 0, 0, 0.2)";
    document.body.appendChild(selectionDiv);

    let startX, startY, endX, endY;
    let isSelecting = false;

    document.addEventListener("mousedown", (e) => {
        isSelecting = true;
        startX = e.clientX;
        startY = e.clientY;
        selectionDiv.style.left = `${startX}px`;
        selectionDiv.style.top = `${startY}px`;
        selectionDiv.style.width = "0px";
        selectionDiv.style.height = "0px";
    });

    document.addEventListener("mousemove", (e) => {
        if (!isSelecting) return;
        endX = e.clientX;
        endY = e.clientY;
        selectionDiv.style.width = `${Math.abs(endX - startX)}px`;
        selectionDiv.style.height = `${Math.abs(endY - startY)}px`;
        selectionDiv.style.left = `${Math.min(startX, endX)}px`;
        selectionDiv.style.top = `${Math.min(startY, endY)}px`;
    });

    document.addEventListener("mouseup", async () => {
        isSelecting = false;
        document.body.removeChild(selectionDiv);

        // Send message to background.js with selection coordinates
        console.log('sending message from content');
        chrome.runtime.sendMessage({

            action: "capture_selected",
            coords: {
                x: Math.min(startX, endX),
                y: Math.min(startY, endY),
                width: Math.abs(endX - startX),
                height: Math.abs(endY - startY)
            }
        });
    });
})();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "crop_image") {
        let img = new window.Image();
        img.src = message.image;
        img.onload = () => {
            let canvas = document.createElement("canvas");
            let ctx = canvas.getContext("2d");

            canvas.width = message.coords.width;
            canvas.height = message.coords.height;

            ctx.drawImage(
                img,
                message.coords.x,
                message.coords.y,
                message.coords.width,
                message.coords.height,
                0, 0,
                message.coords.width,
                message.coords.height
            );

            let croppedImage = canvas.toDataURL("image/png");

            // Send cropped image back to popup.js
            chrome.runtime.sendMessage({ success: true, image: croppedImage });
        };
    }
});

