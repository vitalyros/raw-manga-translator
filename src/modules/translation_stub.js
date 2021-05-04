const events = require('./events.js');
const module_name = 'translate_stub';

var enabled = false;

async function onTextRecongized(event) {
    try {
        await events.fire({
            from: module_name,
            type: events.EventTypes.text_translated,
            data: {
                box: event.data.box,
                image_uri: event.data.image_uri,
                recognized_text: event.data.recognized_text,
                ocr_result: event.data.ocr_result,
                translated_text: `translated text of ${event.data.recognized_text}`
            }
        });
    } catch (e) {
        console.error("Failed onTextRecongized", event, e)
    }
}

export async function enable() {
    if (!enabled) {
        events.addListener(onTextRecongized, events.EventTypes.text_recognized)
        enabled = true
    }
}

export async function disable() {
    if (enabled) {
        events.removeListener(onTextRecongized, events.EventTypes.text_recognized)
        enabled = false
    }
}