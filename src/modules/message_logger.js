var events = require('./events.js');

const module_name = 'message_logger';

var enabled = false;

function onMessage(message) {
    console.log("message_logger: ", message);
}

export async function enable() {
    if (!enabled) {
        events.addListener(onMessage);
        enabled = true;
    }
}

export async function disable() {
    if (enabled) {
        events.removeListener(onMessage);
        enabled = false;
    }
}