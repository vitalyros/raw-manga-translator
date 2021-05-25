const events = require('./events.js');
const tesseract = require('tesseract.js');

const module_name = "recongition_tesseract";
var enabled = false

var workerPromise = null
var worker = null

function logError(...arg) {
    console.error("Error: ", ...arg);
}

async function startTessaract() {
    try {
        var startingWorker = tesseract.createWorker({
            workerPath: browser.extension.getURL("./node_modules/tesseract.js/dist/worker.min.js"),
            langPath: browser.extension.getURL("./lang"),
            corePath: browser.extension.getURL("./node_modules/tesseract.js-core/tesseract-core.wasm.js"),
            logger: e => {
                if (e.status == 'recognizing text') {
                    events.fire({
                        type: events.EventTypes.RecognitionProgress,
                        from: module_name,
                        data: {
                            progress: e.progress
                        }
                    });
                }
                console.log("tesseract message", m)
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
                from: module_name,
                data: {
                    box: event.data.box,
                    recognitionMetrics: startMetrics,
                }
            });
            var ocr_result = await worker.recognize(event.data.image_uri);
            var post_processed_text = ocr_result.data.text.replace(/[\n\r]/g,' '.replace(' ', ''));
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
                from: module_name,
                data: {
                    box: event.data.box,
                    image_uri: event.data.image_uri,
                    ocr_result: ocr_result,
                    recognized_text: post_processed_text,
                    recognitionMetrics: endMetrics,
                }
            });
        } catch (e) {
            logError("recongintion failed", event, e)
            events.fire({
                from: module_name,
                type: events.EventTypes.RecognitionFailure, 
                data: {}
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
        events.addListener(initilizeTesseract, events.EventTypes.start_select_area);
        events.addListener(onImageCaptured, events.EventTypes.image_captured)
        enabled = true
    }
}

export async function disable() {
    if (enabled) {
        events.removeListener(initilizeTesseract, events.EventTypes.start_select_area);
        events.removeListener(onImageCaptured, events.EventTypes.image_captured)
        if (worker != null) {
            worker.terminate();
        }
        enabled = false
    }
}