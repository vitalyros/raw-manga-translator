var events = require('./events.js');

const module_name = 'image_capture_screenshot'
var enabled = false;

async function onAreaSelected(message) {
    try {
        var box = message.data.box
        var detail = {
            quality: 100,
            rect: {
                x: box.x_scrolled,
                y: box.y_scrolled,
                width: box.width,
                height: box.height
            }
        }
        var image_uri = await browser.tabs.captureVisibleTab(null, detail);
        events.fire({
            from: module_name,
            type: events.EventTypes.image_captured,
            data: {
                box: box,
                image_uri: image_uri
            }
        });
    } catch (e) {
        console.error("Failed onAreaSelected", message, e)
    }
}

export async function enable() {
    if (!enabled) {
        events.addListener(onAreaSelected, events.EventTypes.area_selected)
        enabled = true
    }
}

export async function disable() {
    if (enabled) {
        events.removeListener(onAreaSelected, events.EventTypes.area_selected)
        enabled = false
    }
}