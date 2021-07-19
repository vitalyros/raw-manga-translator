/* global require*/
import * as logging from "./utils/logging";

var initializeActiveModeOnce = false;
var events;

// Page Script initialization process
// 1. page script is intialized in lazy mode
//  1.1. event module is loaded
//  1.2. page script starts listening to SelectAreaEnabled event
//  1.3. area selection module is loaded
//  1.4. area selection module fires AreaSelectionModuleEnabled event
// 2. waiting for SelectAreaEnabled event to start active mode initialization
//  2.1. background script handles AreaSelectionModuleEnabled, if tab is registered as active it fires SelectAreaEnabled, otherwise no event is fired
//  2.2. if no SelectAreaEnabled was fired, the user can later manualy enable selection mode, then SelectAreaEnabled is fired
// 3. active mode initialization
//  3.1. page script handles SelectAreaEnabled event. If it is first such event - the plugin is initialized in active mode. It then fires PluginActiveModeInitialized event.
//  3.2. area selection module also handles SelectAreaEnabled and turns active.
//  3.3. area selection module also handles PluginActiveModeInitialized event. Before the event is fired area selection module delays all outgoing events for image recognition.

(async() => {
    try {
        logging.debug("page script lazy mode initialization started");

        initializeActiveModeOnce = true;

        await logging.init();

        events = require("./modules/events.js");
        await events.enable(events.Location.Page);

        var message_logger = require("./modules/message_logger.js");
        await message_logger.enable();

        // the whole plugin is initialized lazily on the first area selection enabled event
        events.addListener(initializePlugin, events.EventTypes.SelectAreaEnabled);

        // initialization of area selection mode might cause SelectAreaEnabled to be fired
        // so it is done after initializePlugin was attached
        var area_selection = require("./modules/area_selection.js");
        await area_selection.enable();

        logging.debug("page script lazy mode initialization success");
    } catch (e) {
        logging.error("page script lazy mode initialization error", e);
    }
})();

async function initializePlugin() {
    if (initializeActiveModeOnce) {
        initializeActiveModeOnce = false;
        try {
            events.removeListener(initializePlugin, events.EventTypes.SelectAreaEnabled);
        } catch (e) {
            logging.debug("failed to remove event listener",  e);
        }
        try {
            logging.debug("page script active mode initialization started");
    
            var recognition = require("./modules/recognition_tesseract.js");
            await recognition.enable();
    
            var recognition_progress = require("./modules/recognition_progress_material.jsx");
            await recognition_progress.enable();
    
            var result_popup = require("./modules/result_popup_material.jsx");
            await result_popup.enable();
    
            var translation_google_translate_tab = require("./modules/translation_google_translate_tab_page.js");
            await translation_google_translate_tab.enable();
    
            var bubble_recognition = require("./modules/bubble_recognition_opencv.js");
            await bubble_recognition.enable();

            logging.debug("page script active mode initialization success");
            events.fire({
                type: events.EventTypes.PageScriptInitializationSuccess
            });
        } catch (e) {
            logging.error("page script active mode initialization failed", e);
            events.fire({
                type: events.EventTypes.PageScriptInitializationFailure
            });
        }
    }
  
}
