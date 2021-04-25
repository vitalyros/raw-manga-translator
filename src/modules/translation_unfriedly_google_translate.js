const translate_api = require('google-translate-api-browser');
const messaging = require('./messaging.js');
const module_name = 'translate_unfriendly_google_translate_api';

var enabled = false;

function logError(...arg) {
    console.error("Error: ", ...arg);
}

function onTextRecongized(message) {
    translate_api.translate(message.data.recognized_text, { to: "en" })
    .then(res => {
        messaging.send({
            from: module_name,
            type: messaging.MessageTypes.text_translated,
            data: {
                recognized_text: message.data.recognized_text,
                translated_text: res.text
            }
        });
    }, logError);
}

function enable() {
    if (!enabled) {
        messaging.addListener(onTextRecongized, messaging.MessageTypes.text_recognized)
        enabled = true
    }
}

function disable() {
    if (enabled) {
        messaging.removeListener(onTextRecongized, messaging.MessageTypes.text_recognized)
        enabled = false
    }
}

module.exports.disable = disable;
module.exports.init = enable;
module.exports.enable = enable;