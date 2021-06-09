// Processes click on image space
// Sends image and click location as ImageClick event

import * as events from './events';
import {loggingForModule} from '../utils/logging';

const moduleName = 'image_click';
const logging = loggingForModule(moduleName)
var enabled = false;

function allImagesFromPoint(clientX, clientY) {
    logging.debug("allImagesFromPoint called", clientX, clientY)
    var element
    var images = [];
    var elements = [];
    var old_visibility = [];
    try {
    while (true) {
        element = document.elementFromPoint(clientX, clientY);
        logging.debug("elementFromPoint", clientX, clientY, element)
        if (!element || element === document.documentElement) {
            break;
        }
        if (element instanceof HTMLImageElement || element instanceof HTMLCanvasElement) {
            images.push(element);
        }
        elements.push(element);
        old_visibility.push(element.style.visibility);
        element.style.visibility = 'hidden'; 
    }
    } finally {
        logging.debug("allImagesFromPoint restroring visiblility", elements, old_visibility)
        for (var k = 0; k < elements.length; k++) {
            elements[k].style.visibility = old_visibility[k];
        }
    }
    images.reverse();
    logging.debug("allImagesFromPoint success", clientX ,clientY, elements, images)
    return images;
}

export function onClick(event) {
    try {
        logging.debug("onClick called", event)
        const images = allImagesFromPoint(event.clientX, event.clientY)
        // Fire event with all image elements and let the bubble recognition decide which to use
        if (images.length > 0) {
            events.fire({
                from: moduleName,
                type: events.EventTypes.ImagesClicked,
                data: {
                    images: images,
                    clientX: event.clientX,
                    clientY: event.clientY
                }
            }, true)
        }
        logging.debug("onClick succes", event)
    } catch (e) {
        logging.error("onClick failed", event, e)
    }
}

export function enable() {
    if(!enabled) {
        enabled = true
        logging.debug("module enabled")
    }
}

export function disable() {
    if(enabled) {
        enabled = false
        logging.debug("module disabled")
    }
}