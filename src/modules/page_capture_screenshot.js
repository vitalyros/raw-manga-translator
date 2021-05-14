var events = require('./events.js');

const module_name = 'page_capture_screenshot'
var enabled = false;

async function onPageInitialized(message) {
    try {
        var data = message.data
        var rect = {
            x: 0,
            y: 0,
            width: data.width * 3,
            height: data.height * 3
        }
        var detail = {
            quality: 100,
            rect: rect
        }
        var imageUri = await browser.tabs.captureVisibleTab(null, detail);
        events.fire({
            from: module_name,
            type: events.EventTypes.PageImageCaptured,
            data: {
                rect: rect,
                imageUri: imageUri
            }
        });
    } catch (e) {
        console.error("Failed onPageInitialized", message, e)
    }
}

export async function enable() {
    if (!enabled) {
        events.addListener(onPageInitialized, events.EventTypes.PageInitialized)
        enabled = true
    }
}

export async function disable() {
    if (enabled) {
        events.removeListener(onPageInitialized, events.EventTypes.PageInitialized)
        enabled = false
    }
}