import * as events from './events.js'

var moduleName = 'tab_scaling';
var enabled = false;

function onZoomChange(e) {
    events.fire({
        type: events.EventTypes.TabZoomChanged,
        from: moduleName,
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