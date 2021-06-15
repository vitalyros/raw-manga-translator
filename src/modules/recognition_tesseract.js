const events = require('./events.js');
const tesseract = require('tesseract.js');
import { loggingForModule } from '../utils/logging'

const moduleName = "recongition_tesseract";
const logging = loggingForModule(moduleName)
var enabled = false

var workerPromise = null
var worker = null

async function startTessaract() {
    try {
        var startingWorker = tesseract.createWorker({
            workerPath: browser.extension.getURL("./dist/tesseract/worker.min.js"),
            langPath: browser.extension.getURL("./lang"),
            corePath: browser.extension.getURL("./dist/tesseract-core/tesseract-core.wasm.js"),
            logger: e => {
                if (e.status == 'recognizing text') {
                    events.fire({
                        type: events.EventTypes.RecognitionProgress,
                        from: moduleName,
                        data: {
                            progress: e.progress
                        }
                    });
                }
                logging.debug("tesseract message", m)
            }
        });
        await startingWorker.load();

        await startingWorker.loadLanguage('jpn+jpn_vert');
        await startingWorker.initialize('jpn+jpn_vert');
        await startingWorker.setParameters({
            tessedit_pageseg_mode: '3',
            preserve_interword_spaces: '1',
            tessedit_create_box: '1',
            tessedit_create_unlv: '1',
            tessedit_create_osd: '1',
          });
        worker = startingWorker
        return worker
    } catch (e) {
        logError("failed to start tesseract", e)
    }
}

async function onImageCaptured(event) {
    if (enabled) {
        await waitForTesseract()
        try {
            var startDate = new Date();
            var startMetrics = { 
                startDate: startDate, 
                startTime: startDate.getTime() 
            }
            events.fire({
                type: events.EventTypes.RecognitionStart,
                from: moduleName,
                data: {
                    point: event.data.point,
                    box: event.data.box,
                    recognitionMetrics: startMetrics,
                }
            });
            var ocr_result = await worker.recognize(event.data.image_uri);
            var post_processed_text = ocr_result.data.text.replace(/[\n\r]/g,'').replace(/\s+/g,'');
            var endDate = new Date();
            var endMetrics = { 
                startDate: startMetrics.startDate, 
                startTime: startMetrics.startTime,
                endDate: endDate,
                endTime: endDate.getTime(),
                duration: startDate.getTime() - endDate.getTime()
            }
            events.fire({
                type: events.EventTypes.RecognitionSuccess,
                from: moduleName,
                data: {
                    point: event.data.point,
                    box: event.data.box,
                    image_uri: event.data.image_uri,
                    ocr_result: ocr_result,
                    recognized_text: post_processed_text,
                    recognitionMetrics: endMetrics,
                }
            });
        } catch (e) {
            events.fire({
                from: moduleName,
                type: events.EventTypes.RecognitionFailure, 
                data: {
                    point: event.data.point,
                    box: event.data.box,
                    image_uri: event.data.image_uri,
                }
            })
        }
    } 
}

async function waitForTesseract() {
    if (worker != null) {
        return worker
    } else {
        await initilizeTesseract()
    }
    return worker;
}

function initilizeTesseract() {
    if (workerPromise == null) {
        workerPromise = startTessaract()
    } 
    return workerPromise;
}

export async function enable() {
    if (!enabled) {
        events.addListener(initilizeTesseract, events.EventTypes.SelectAreaEnabled);
        events.addListener(onImageCaptured, events.EventTypes.ImageCaptureSuccess)
        enabled = true
        logging.debug("module enabled")
    }
}

export async function disable() {
    if (enabled) {
        events.removeListener(initilizeTesseract, events.EventTypes.SelectAreaEnabled);
        events.removeListener(onImageCaptured, events.EventTypes.ImageCaptureSuccess)
        if (worker != null) {
            worker.terminate();
        }
        enabled = false
        logging.debug("module disabled")
    }
}