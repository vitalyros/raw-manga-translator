import { loggingForModule } from '../utils/logging';
import * as events from './events';

const moduleName = 'selection_mode_activation';

const MENU_ITEM_ID = 'romatora-main-menu-item';
const ENABLE_TITLE = 'Enable raw manga translation';
const DISABLE_TITLE = 'Disable raw manga translation';

const BROWSER_ACTION_ICON_ENABLED = "icons/icon-64-enabled.png";
const BROWSER_ACTION_ICON_DISABLED = "icons/icon-64-disabled.png";

var enabled = false;

const logging = loggingForModule(moduleName)

var activeTabId = null;
var selectionModePerTab = {}

function setSelectionModeForCurrentTab(mode) {
    if (activeTabId) {
        selectionModePerTab[activeTabId] = mode
    }
}

async function ensureActiveTabId() {
    if (activeTabId == null) {
        let activeTab = await browser.tabs.getCurrent()
        if (activeTab) {
            activeTabId = activeTabId.id
        }
    }
}

function getSelectionModeForCurrentTab() {
    if (activeTabId) {
        return Boolean(selectionModePerTab[activeTabId])
    } else {
        return false;
    }
}

async function changeSelectionMenuState(mode) {
    logging.debug("Changing selection menu state", mode)
    await updateContextMenuItem(mode);
    await updateBrowserActionIcon(mode);
}

function getContextMenuItemTitle(mode) {
    return mode ? DISABLE_TITLE : ENABLE_TITLE
}   

function getBrowserActionIcon(mode) {
    return mode ? BROWSER_ACTION_ICON_ENABLED : BROWSER_ACTION_ICON_DISABLED
}

async function updateContextMenuItem(mode) {
    await browser.menus.update(MENU_ITEM_ID,
    {
        title: getContextMenuItemTitle(mode)
    });
}

async function updateBrowserActionIcon(mode) {
    const theme = await browser.theme.getCurrent()
    logging.debug("Current theme",  theme)
    await browser.browserAction.setIcon({
        tabId: activeTabId,
        path: getBrowserActionIcon(mode)
    }); 
}


async function changeSelectionTabState(mode) {
    try {
        if (mode) {
            await events.fire({
                type: events.EventTypes.SelectAreaEnabled,
                from: moduleName,
                data: {}
            });
        } else {
            await events.fire({
                type: events.EventTypes.SelectAreaDisabled,
                from: moduleName,
                data: {}
            });
        }
    } catch (e) {
        logging.error("failed to change selection tab state", e)
    }
}

async function onSelectionModeSwitch() {
    try {
        await ensureActiveTabId()
        let newMode = !getSelectionModeForCurrentTab()
        await setSelectionModeForCurrentTab(newMode);
        await changeSelectionMenuState(newMode);
        await changeSelectionTabState(newMode);
    } catch(e) {
        logging.error("failed onSelectionModeSwitch", e)
    }
}

function tabActivated(event) {
    activeTabId = event.tabId
    var mode = getSelectionModeForCurrentTab()
    logging.debug("tab activated, current selection mode", mode)
    changeSelectionMenuState(mode);
}

function tabRemoved(tabId) {
    delete selectionModePerTab[tabId]
}

async function passCurrentMode() {
    await ensureActiveTabId()
    var mode = getSelectionModeForCurrentTab()
    if (mode) {
        changeSelectionTabState(mode);
    }
}

async function intiializeSelectionMenu() {
    await browser.menus.remove(MENU_ITEM_ID)
    await browser.menus.create( {
        id: MENU_ITEM_ID,
        title: getContextMenuItemTitle(false),
        contexts: ['page', 'image'],
        onclick: onSelectionModeSwitch
    });
}


export async function enable() {
    if (!enabled) {
        await intiializeSelectionMenu(); 
        browser.tabs.onActivated.addListener(tabActivated);
        browser.tabs.onRemoved.addListener(tabRemoved);
        events.addListener(passCurrentMode, events.EventTypes.SelectionModeEnabled);
        await updateBrowserActionIcon(false)
        browser.browserAction.onClicked.addListener(onSelectionModeSwitch)
        enabled = true;
        logging.debug("module enabled")
    }
}

export async function disable() {
    if (enabled) {
        browser.tabs.onActivated.removeListener(tabActivated);
        browser.tabs.onRemoved.removeListener(tabRemoved);
        browser.browserAction.onClicked.removeListener(onSelectionModeSwitch);
        browser.menus.remove(MENU_ITEM_ID);
        enabled = false;
        logging.debug("module disabled")
    }
}

