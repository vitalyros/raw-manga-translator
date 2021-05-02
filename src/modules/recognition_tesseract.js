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
            logger: m => console.log("tesseract message", m)
        });
        await startingWorker.load();

        await startingWorker.loadLanguage('jpn+jpn_vert');
        await startingWorker.initialize('jpn+jpn_vert');
        // await worker.loadLanguage('jpn');
        // await worker.initialize('jpn');
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

async function onImageCaptured(message) {
    if (enabled) {
        await waitForTesseract()
        try {
            var ocr_result = await worker.recognize(message.data.image_uri);
            var post_processed_text = ocr_result.data.text.replace(/[\n\r]/g,' '.replace(' ', ''));
            events.fire({
                from: module_name,
                type: events.EventTypes.text_recognized, 
                data: {
                    box: message.data.box,
                    image_uri: message.data.image_uri,
                    ocr_result: ocr_result,
                    recognized_text: post_processed_text
                }
            })
        } catch (e) {
            logError("recongintion failed", message, e)
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
        events.removeListener(preInitilizeTesseract, events.EventTypes.start_select_area);
        events.removeListener(onImageCaptured, events.EventTypes.image_captured)
        if (worker != null) {
            worker.terminate();
        }
        enabled = false
    }
}