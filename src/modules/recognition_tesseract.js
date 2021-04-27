const messaging = require('./messaging.js');
const tesseract = require('tesseract.js');

const module_name = "recongition_tesseract";
var enabled = false
var worker = null

function logError(...arg) {
    console.error("Error: ", ...arg);
}

function startTessaract() {
    console.log("starting tesseract");
    worker = tesseract.createWorker({
    workerPath: browser.extension.getURL("./node_modules/tesseract.js/dist/worker.min.js"),
    langPath: browser.extension.getURL("./lang"),
    corePath: browser.extension.getURL("./node_modules/tesseract.js-core/tesseract-core.wasm.js"),
    logger: m => console.log("tesseract message" + m),
    });
    console.log("tesseract started");
    (async () => {
    console.log("tesseract loeading languages");
    await worker.load();
    await worker.loadLanguage('jpn');
    await worker.initialize('jpn');
    console.log("tesseract loaded languages");
    })();
}

function onImageCaptured(message) {
    if (enabled) {
        worker.recognize(message.data.image_uri).then(
            function(recresult) { 
                messaging.send({
                    from: module_name,
                    type: messaging.MessageTypes.text_recognized, 
                    data: {
                        box: message.data.box,
                        image_uri: message.data.image_uri,
                        recognized_text: recresult.data.text
                    }
                })
            }, logError);
    }
}

function enable() {
    if (!enabled) {
        startTessaract()
        messaging.addListener(onImageCaptured, messaging.MessageTypes.image_captured)
        enabled = true
    }
}

function disable() {
    if (enabled) {
        messaging.removeListener(onImageCaptured, messaging.MessageTypes.image_captured)
        if (worker != null) {
            worker.terminate();
        }
        enabled = false
    }
}

module.exports.disable = disable;
module.exports.init = enable;
module.exports.enable = enable;