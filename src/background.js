/* global require*/
import * as logging from "./utils/logging";
(async() => {
    try {
        await logging.init();
        
        var events = require("./modules/events.js");
        await events.enable(events.Location.Background);

        var message_logger = require("./modules/message_logger.js");
        await message_logger.enable();

        var context_menu = require("./modules/selection_mode_activation.js");
        await context_menu.enable();

        var translation_stub = require("./modules/translation_stub.js");
        await translation_stub.enable();
        
        var translation_google_translate = require("./modules/translation_google_translate_api.js");
        await translation_google_translate.enable();

        var translation_google_translate_tab = require("./modules/translation_google_translate_tab_browser.js");
        await translation_google_translate_tab.enable();

        var image_capture = require("./modules/image_capture_screenshot.js");
        await image_capture.enable();
    } catch (e) {
        logging.error("initialization error", e);
    }
})();
