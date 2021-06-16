import * as events from "./events.js";
import { loggingForModule } from "../utils/logging";
// const tesseract = require("tesseract.js");

const moduleName = "recongition_stub";
const logging = loggingForModule(moduleName);

var enabled = false;
var throwError = false;

async function onImageCaptured(event) {
    if (enabled) {
        try {
            var startDate = new Date();
            var startMetrics = { 
                startDate: startDate, 
                startTime: startDate.getTime() 
            };
            events.fire({
                type: events.EventTypes.RecognitionStart,
                from: moduleName,
                data: {
                    point: event.data.point,
                    box: event.data.box,
                    recognitionMetrics: startMetrics,
                }
            });
            var endDate = new Date();
            var endMetrics = { 
                startDate: startMetrics.startDate, 
                startTime: startMetrics.startTime,
                endDate: endDate,
                endTime: endDate.getTime(),
                duration: startDate.getTime() - endDate.getTime()
            };
            if (throwError) {
                events.fire({
                    type: events.EventTypes.RecognitionSuccess,
                    from: moduleName,
                    data: {
                        point: event.data.point,
                        box: event.data.box,
                        image_uri: event.data.image_uri,
                        ocr_result: null,
                        recognized_text: "こにちわ",
                        recognitionMetrics: endMetrics,
                    }
                });
            } else {
                events.fire({
                    from: moduleName,
                    type: events.EventTypes.RecognitionFailure, 
                    data: {
                        point: event.data.point,
                        box: event.data.box,
                        image_uri: event.data.image_uri,
                    }
                });
            }
        } catch (e) {
            events.fire({
                from: moduleName,
                type: events.EventTypes.RecognitionFailure, 
                data: {
                    point: event.data.point,
                    box: event.data.box,
                    image_uri: event.data.image_uri,
                }
            });
        }
    } 
}

export async function enable() {
    if (!enabled) {
        events.addListener(onImageCaptured, events.EventTypes.ImageCaptureSuccess);
        enabled = true;
        logging.debug("module enabled");
    }
}

export async function disable() {
    if (enabled) {
        events.removeListener(onImageCaptured, events.EventTypes.ImageCaptureSuccess);
        enabled = false;
        logging.debug("module disabled");
    }
} 