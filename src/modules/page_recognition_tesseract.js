const events = require('./events.js');
const tesseract = require('tesseract.js');

const module_name = "page_recongition_tesseract";
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

async function onPageImageCaptured(message) {
    if (enabled) {
        await waitForTesseract()
        try {
            var date1 = new Date();
            console.log("recognition started at", date1)
            // To calculate the time difference of two dates
            var ocr_result = await worker.recognize(message.data.imageUri);
            var date2 = new Date();
            var dateDiff = date2.getTime() - date1.getTime();
            console.log("recognition ended at", date1)
            console.log(`recognition lasted ${dateDiff}`, dateDiff)
            console.log("page image ocr", ocr_result);
            // var post_processed_text = ocr_result.data.text.replace(/[\n\r]/g,' '.replace(' ', ''));
            // events.fire({
            //     from: module_name,
            //     type: events.EventTypes.text_recognized, 
            //     data: {
            //         box: message.data.box,
            //         image_uri: message.data.image_uri,
            //         ocr_result: ocr_result,
            //         recognized_text: post_processed_text
            //     }
            // })
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
        events.addListener(initilizeTesseract, events.EventTypes.PageInitialized);
        events.addListener(onPageImageCaptured, events.EventTypes.PageImageCaptured)
        enabled = true
    }
}

export async function disable() {
    if (enabled) {
        events.removeListener(onPageImageCaptured, events.EventTypes.PageInitialized);
        events.removeListener(onPageImageCaptured, events.EventTypes.PageImageCaptured)
        if (worker != null) {
            worker.terminate();
        }
        enabled = false
    }
}