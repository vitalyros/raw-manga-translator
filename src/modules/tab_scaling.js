import * as events from './events.js'

var module_name = 'tab_scaling';
var enabled = false;

function onZoomChange(e) {
    events.fire({
        type: events.EventTypes.TabZoomChanged,
        from: module_name,
        data: e
    })
}


export async function enable() {
    if (!enabled) {
        browser.tabs.onZoomChange.addListener(onZoomChange)
        enabled = true
    }
}

export async function disable() {
    if (enabled) {
        browser.tabs.onZoomChange.addListener(onZoomChange)
        enabled = false
    }
}