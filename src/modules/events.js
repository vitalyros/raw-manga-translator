export const Location = {
    Undefined: 'Undefined',
    Background: 'Background',
    Page: 'Page'
}

export const EventTypes = {
    module_area_selection_enabled: 'module_area_selection_enabled',

    translation_reset: 'translation_reset', 
    start_select_area: 'start_select_area',
    cancel_select_area: 'cancel_select_area',
    area_selected: 'area_selected',
    image_captured: 'image_captured',
    text_recognized: 'text_recognized',
    text_translated: 'text_translated',
    pipeline_failed: 'pipeline_failed'
}

var plugin_nickname = 'romatora'
var enabled = false;
var location = Location.Undefined
var listeners_by_type = {};
var listeners_for_all = [];

function logError(...arg) {
    console.error("Error: ", ...arg);
}

async function sendToActiveTab(event) {
    var tabs = await browser.tabs.query({active: true, currentWindow: true, discarded: false, windowType: 'normal'});
    var sent = false
    for (let tab of tabs) {
        if (typeof tab.url !== 'undefined') {
            browser.tabs.sendMessage(tab.id, event);
            sent = true;
        }
    };
    if (!sent) {
        console.warn("Not found active tab to send to ", event)
    }
}

async function sendToPluginBackground(event) {
    await browser.runtime.sendMessage(browser.runtime.id, event)
}

export async function fire(event) {
    if (enabled) {
        event.nick = plugin_nickname
        onEvent(event);
        if (location === Location.Background) {
            sendToActiveTab(event)
        }
        if (location === Location.Page) {
            sendToPluginBackground(event)
        }
    }
}
 
function onEvent(event) {
    if (enabled) {
        var nick = event.nick;
        if (typeof nick !== 'undefined' && nick === plugin_nickname) {

            listeners_for_all.forEach(listener => listener(event));

            if (typeof event.type !== 'undefined') {
                var type_listeners = listeners_by_type[event.type];
                if (typeof type_listeners !== 'undefined') {
                    type_listeners.forEach(listener => listener(event)) 
                }
            }   
        }
    }
}  

export function addListener(listener, event_type) {
    if (typeof event_type !== 'undefined') {
        var type_listeners = listeners_by_type[event_type];
        if (typeof type_listeners === 'undefined') {
            type_listeners = [];
            listeners_by_type[event_type] = type_listeners;
        }
        var index = type_listeners.indexOf(listener);
        if (index === -1) {
            type_listeners.push(listener);
        } else {
            console.error('Failed to add listener. Listener for event type already added', listener, event_type)
        }
    } else {
        var index = listeners_for_all.indexOf(listener);
        if (index === -1) {
            listeners_for_all.push(listener);
        } else {
            console.error('Failed to add listener. Listener already added', listener)
        }
    }
}

export function removeListener(listener, event_type) {
    if (typeof event_type !== 'undefined') {
        var type_listeners = listeners_by_type[event_type];
        if (typeof type_listeners === 'undefined') {
            onError('Failed to remove listener. Listener for event type type not found ', listener, event_type)
        } else {
            var index = type_listeners.indexOf(listener);
            if (index !== -1) {
                type_listeners.splice(index, 1);
            } else {
                onError('Failed to remove listener. Listener for event type not found', listener, event_typeype)
            }
        }
    } else {
        var index = listeners_for_all.indexOf(listener);
        if (index !== -1) {
            listeners_for_all.splice(index, 1);
        } else {
            onError('Failed to remove listener. Listener for all event types not found ', listener)
        }
    }
}


export async function enable(event_location) {
    if (!enabled) {
        if (typeof event_location !== 'undefined') {
            location = event_location;
        } 
        await browser.runtime.onMessage.addListener(onEvent);
        enabled = true;
    }
}

export async function disable() {
    if (enabled) {
        await browser.runtime.onMessage.removeListener(onEvent);
        location = Location.Undefined;
        enabled = false;
    }
}
