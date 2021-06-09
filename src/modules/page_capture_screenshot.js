import * as events from './events';
import * as logging from '../utils/logging';

const module_name = 'page_capture_screenshot'
var enabled = false;

async function onPageInitialized(message) {
    try {
        var rect = {
            x: 0,
            y: 0,
            width: window.innerWidth * 0.5,
            height: window.innerHeight * 0.5
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
        events.addListener(onPageInitialized, events.EventTypes.SelectAreaEnabled)
        enabled = true
    }
}

export async function disable() {
    if (enabled) {
        events.removeListener(onPageInitialized, events.EventTypes.SelectAreaEnabled)
        enabled = false
    }
}