import * as events from './events';
import { loggingForModule } from '../utils/logging';

const moduleName = 'image_capture_screenshot'
const logging = loggingForModule(moduleName)
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
            from: moduleName,
            type: events.EventTypes.ImageCaptureSuccess,
            data: {
                point: message.data.point,
                box: box,
                image_uri: image_uri
            }
        });
    } catch (e) {
        logging.error("Failed onAreaSelected", message, e)
    }
}

export async function enable() {
    if (!enabled) {
        events.addListener(onAreaSelected, events.EventTypes.SelectAreaSuccess)
        enabled = true
        logging.debug("module enabled")
    }
}

export async function disable() {
    if (enabled) {
        events.removeListener(onAreaSelected, events.EventTypes.SelectAreaSuccess)
        enabled = false
        logging.debug("module disabled")
    }
}