const Location = {
    undefined: 'undefined',
    background: 'background',
    page: 'page'
}

const MessageTypes = {
    translation_reset: 'translation_reset', 
    select_area_to_translate: 'select_area_to_translate',
}

var plugin_nickname = 'romatora'
var enabled = false;
var location = Location.undefined
var listeners_by_type = {};
var listeners_for_all = [];

function logError(...arg) {
    console.error("Error: ", ...arg);
}

function sendToActiveTab(message) {
    var tab = browser.tabs.query({active: true, currentWindow: true, discarded: false, windowType: 'normal', status: 'complete'});
    tab.then(function (tabs) {
        for (let tab of tabs) {
            if (typeof tab.url !== 'undefined') {
                browser.tabs.sendMessage(tab.id, message);
            }
        }
    }, logError);
}

function sendToPluginBackground(message) {
    browser.runtime.sendMessage(browser.runtime.id, message)
}

function send(message) {
    if (enabled) {
        message.nick = plugin_nickname
        onMessage(message);
        if (location === Location.Background) {
            sendToActiveTab(message)
        }
        if (location === Location.Page) {
            sendToPluginBackground(message)
        }
    }
}
 
function onMessage(message) {
    if (enabled) {
        var nick = message.nick;
        if (typeof nick !== 'undefined' && nick === plugin_nickname) {

            listeners_for_all.forEach(listener => listener(message));

            if (typeof message.type !== 'undefined') {
                var type_listeners = listeners_by_type[message.type];
                if (typeof type_listeners !== 'undefined') {
                    type_listeners.forEach(listener => listener(message)) 
                }
            }   
        }
    }
}  

function addListener(listener, types) {
    if (typeof types !== 'undefined') {
        types.forEach(type => {
            var type_listeners = listeners_by_type[message_type];
            if (typeof type_listeners === 'undefined') {
                type_listeners = [];
                listeners_by_type[message_type] = type_listeners;
            }
            var index = type_listeners.indexOf(listener);
            if (index === -1) {
                type_listeners.push(listener);
            } else {
                console.error('Failed to add listener. Listener already added', listener)
            }
        });
    } else {
        var index = listeners_for_all.indexOf(listener);
        if (index === -1) {
            listeners_for_all.push(listener);
        } else {
            console.error('Failed to add listener. Listener already added', listener)
        }
    }
}

function removeListener(listener, message_types) {
    if (typeof message_types !== 'undefined') {
        message_types.message_type(type => {
            var type_listeners = listeners[message_type];
            if (typeof type_listeners === 'undefined') {
                onError('Failed to remove listener. Listener for message type type not found ', listener, type)
            } else {
                var index = type_listeners.indexOf(listener);
                if (index !== -1) {
                    type_listeners.splice(index, 1);
                } else {
                    onError('Failed to remove listener. Listener for message type not found', listener, type)
                }
            }
        });
    } else {
        var index = listeners_for_all.indexOf(listener);
        if (index !== -1) {
            listeners_for_all.splice(index, 1);
        } else {
            onError('Failed to remove listener. Listener for all message types not found ', listener)
        }
    }
}


function enable(messaging_location) {
    if (!enabled) {
        if (typeof messaging_location !== 'undefined') {
            location = messaging_location;
        } 
        browser.runtime.onMessage.addListener(onMessage);
        enabled = true;
    }
}

function disable() {
    if (enabled) {
        browser.runtime.onMessage.removeListener(onMessage);
        location = Location.undefined;
        enabled = false;
    }
}

module.exports.MessageTypes = MessageTypes;
module.exports.Location = Location;
module.exports.send = send;
module.exports.addListener = addListener;
module.exports.removeListener = removeListener;
module.exports.disable = disable;
module.exports.init = enable;
module.exports.enable = enable;
