import * as tabs from "../utils/tabs";
import {APP_NAME} from "../utils/const";
import {loggingForModule} from "../utils/logging";

const logging = loggingForModule("events");

export const Location = {
    Undefined: "Undefined",
    Background: "Background",
    Page: "Page"
};

export const EventTypes = {
    AreaSelectionExclusionZoneUpdate: "AreaSelectionExclusionZoneUpdate",
    AreaSelectionExclusionZoneDragUpdate: "AreaSelectionExclusionZoneDragUpdate",

    GoogleTranslateTabTranslationRequested: "GoogleTranslateTabTranslationRequested",
    GoogleTranslateTabTranslationFinished: "GoogleTranslateTabTranslationFinished",
    GoogleTranslateTabTranslationEnabled: "GoogleTranslateTabTranslationEnabled",

    PageImageCaptured: "PageImageCaptured",
    
    PageInitialized: "PageInitialized",

    RecognitionStart: "RecognitionStart",
    RecognitionProgress: "RecognitiionProgress",
    RecognitionSuccess: "RecognitionSuccess",
    RecognitionFailure: "RecognitionFailure",

    SelectionModeEnabled: "SelectionModeEnabled",

    AccordionResized: "AccordionResized",

    ImagesClicked: "ImagesClicked",

    SelectAreaEnabled: "SelectAreaEnabled",
    SelectAreaDisabled: "SelectAreaDisabled",
    SelectAreaStart: "SelectAreaStart",
    SelectAreaSuccess: "SelectAreaSuccess",

    ImageCaptureSuccess: "ImageCaptureSuccess",

    TranslationRequested: "TranslationRequested",
    TranslationSuccess: "TranslationSuccess",
    TranslationFailure: "TranslationFailure",

    BubbleRecognitionFailure: "BubbleRecognitionFailure"
};

var enabled = false;
var location = Location.Undefined;
var listeners_by_type = {};
var listeners_for_all = [];


async function sendToActiveTab(event) {
    var tab = await tabs.getActiveTab();
    if (tab) {
        browser.tabs.sendMessage(tab.id, event);
    } else {
        logging.warn("Not found active tab to send to ", event);
    }
}

async function sendToPluginBackground(event) {
    await browser.runtime.sendMessage(browser.runtime.id, event);
}

// local = true means it should not be sent from Background to Page or from Page to Background
export async function fire(event, local) {
    if (enabled) {
        event.nick = APP_NAME;
        onEvent(event);
        if (!local) {
            if (location === Location.Background) {
                sendToActiveTab(event);
            }
            if (location === Location.Page) {
                sendToPluginBackground(event);
            }
        }
    }
}
 
async function onEvent(event) {
    if (enabled) {
        var nick = event.nick;
        if (typeof nick !== "undefined" && nick === APP_NAME) {
            listeners_for_all.forEach(async listener => {
                try {
                    await listener(event);
                } catch(e) {
                    logging.error("listener failed to handle event", event, listener, e);
                }
            });

            if (typeof event.type !== "undefined") {
                var type_listeners = listeners_by_type[event.type];
                if (typeof type_listeners !== "undefined") {
                    type_listeners.forEach(async listener => {
                        try {
                            await listener(event);
                        } catch(e) {
                            logging.error("listener failed to handle event", event, listener, e);
                        }   
                    }); 
                }
            }   
        }
    }
}  

export function addListener(listener, event_type) {
    if (typeof event_type !== "undefined") {
        var type_listeners = listeners_by_type[event_type];
        if (typeof type_listeners === "undefined") {
            type_listeners = [];
            listeners_by_type[event_type] = type_listeners;
        }
        let index = type_listeners.indexOf(listener);
        if (index === -1) {
            type_listeners.push(listener);
        } else {
            logging.error("Failed to add listener. Listener for event type already added", listener, event_type);
        }
    } else {
        let index = listeners_for_all.indexOf(listener);
        if (index === -1) {
            listeners_for_all.push(listener);
        } else {
            logging.error("Failed to add listener. Listener already added", listener);
        }
    }
}

export function removeListener(listener, event_type) {
    if (typeof event_type !== "undefined") {
        var type_listeners = listeners_by_type[event_type];
        if (typeof type_listeners === "undefined") {
            logging.error("Failed to remove listener. Listener for event type type not found ", listener, event_type);
        } else {
            let index = type_listeners.indexOf(listener);
            if (index !== -1) {
                type_listeners.splice(index, 1);
            } else {
                logging.error("Failed to remove listener. Listener for event type not found", listener, event_type);
            }
        }
    } else {
        let index = listeners_for_all.indexOf(listener);
        if (index !== -1) {
            listeners_for_all.splice(index, 1);
        } else {
            logging.error("Failed to remove listener. Listener for all event types not found ", listener);
        }
    }
}


export async function enable(event_location) {
    if (!enabled) {
        if (typeof event_location !== "undefined") {
            location = event_location;
        } 
        await browser.runtime.onMessage.addListener(onEvent);
        enabled = true;
        logging.debug("module enabled");
    }
}

export async function disable() {
    if (enabled) {
        await browser.runtime.onMessage.removeListener(onEvent);
        location = Location.Undefined;
        enabled = false;
        logging.debug("module disabled");
    }
}
