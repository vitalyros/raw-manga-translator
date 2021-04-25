var messaging = require('./messaging.js');

const module_name = 'message_logger';

var enabled = false;

function onMessage(message) {
    console.log("message_logger: ", message);
}

function enable() {
    if (!enabled) {
        messaging.addListener(onMessage);
        enabled = true;
    }
}

function disable() {
    if (enabled) {
        messaging.removeListener(onMessage);
        enabled = false;
    }
}

module.exports.disable = disable;
module.exports.init = enable;
module.exports.enable = enable;