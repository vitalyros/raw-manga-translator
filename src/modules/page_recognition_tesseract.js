const events = require('./events.js');
const tesseract = require('tesseract.js');
import * as events from "./events.js";
import { loggingForModule } from '../utils/logging'

const moduleName = "page_recongition_tesseract";
const logging = loggingForModule(moduleName)
var enabled = false
var workerPromise = null
var worker = null

async function startTessaract() {
    try {
        var startingWorker = tesseract.createWorker({
            workerPath: browser.extension.getURL("./node_modules/tesseract.js/dist/worker.min.js"),
            langPath: browser.extension.getURL("./lang"),
            corePath: browser.extension.getURL("./node_modules/tesseract.js-core/tesseract-core.wasm.js"),
            logger: m => logging.debug("tesseract message", m)
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
        logging.error("failed to start tesseract", e)
    }
}

async function onPageImageCaptured(message) {
    if (enabled) {
        await waitForTesseract()
        try {
            var date1 = new Date();
            logging.debug("recognition started at", date1)
            // To calculate the time difference of two dates
            var ocr_result = await worker.recognize(message.data.imageUri);
            var date2 = new Date();
            var dateDiff = date2.getTime() - date1.getTime();
            logging.debug("recognition ended at", date1)
            logging.debug(`recognition lasted ${dateDiff}`, dateDiff)
            logging.debug("page image ocr", ocr_result);
        } catch (e) {
            logging.error("recongintion failed", message, e)
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