var events = require('./events.js');

const module_name = 'context_menu';

const menu_item_id = 'romatora-main-menu-item';
const select_title = 'Select area to translate';
const cancel_title = 'Cancel area selection';

var enabled = false;

var active_tab_id = null;
var selection_enabled_per_tab = {}

function setAreaSelectionForCurrentTab(selection) {
    if (active_tab_id != null) {
        selection_enabled_per_tab[active_tab_id] = selection
    }
}

function getAreaSelectionForCurrentTab() {
    if (active_tab_id != null) {
        var result = selection_enabled_per_tab[active_tab_id];
        if (typeof result === 'undefined' || result == null) {
            return false;
        } else {
            return result;
        }
    } else {
        return false;
    }
}

function changeSelectionMenuState(selection) {
    if (selection) {
        browser.menus.update(menu_item_id,
            {
            title: cancel_title,
            onclick: onCancelSelectionClick
        });
    } else {
        browser.menus.update(menu_item_id,
            {
                title: select_title,
                onclick: onSelectAreaClick
            });
    }
}

async function intiializeSelectionMenu() {
    await browser.menus.remove(menu_item_id)
    await browser.menus.create( {
        id: menu_item_id,
        title: select_title,
        contexts: ['page', 'image'],
        onclick: onSelectAreaClick
    });
}

async function changeSelectionTabState(selection) {
    if (selection) {
        events.fire({
            type: events.EventTypes.start_select_area,
            from: module_name,
            data: {}
        });
    } else {
        events.fire({
            type: events.EventTypes.cancel_select_area,
            from: module_name,
            data: {}
        });
    }
}


async function onSelectAreaClick() {
    try {
        changeSelectionMenuState(true);
        setAreaSelectionForCurrentTab(true);
        changeSelectionTabState(true);
    } catch(e) {
        console.log("failed onSelectAreaClick", e)
    }
}

async function onCancelSelectionClick() {
    try {
        changeSelectionMenuState(false);
        setAreaSelectionForCurrentTab(false);
        changeSelectionTabState(false);
    } catch(e) {
        console.log("failed onCancelSelectionClick", e)
    }
}

function tabActivated(event) {
    active_tab_id = event.tabId
    var selection = getAreaSelectionForCurrentTab()
    changeSelectionMenuState(selection);
}

function tabRemoved(tabId) {
    delete selection_enabled_per_tab[tabId]
}

async function passCurrentSelectionState() {
    var selection = getAreaSelectionForCurrentTab()
    if (selection) {
        changeSelectionTabState(selection);
    }
}

export async function enable() {
    if (!enabled) {
        await intiializeSelectionMenu(); 
        browser.tabs.onActivated.addListener(tabActivated);
        browser.tabs.onRemoved.addListener(tabRemoved);
        events.addListener(passCurrentSelectionState, events.EventTypes.module_area_selection_enabled);
        enabled = true
    }
}

export async function disable() {
    if (enabled) {
        browser.tabs.onActivated.removeListener(tabActivated);
        browser.tabs.onRemoved.removeListener(tabRemoved);
        browser.menus.remove(menu_item_id)
        enabled = false
    }
}