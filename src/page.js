/* global require*/
import * as logging from "./utils/logging";

(async() => {
    try {
        await logging.init();

        var events = require("./modules/events.js");
        await events.enable(events.Location.Page);

        var message_logger = require("./modules/message_logger.js");
        await message_logger.enable();

        var recognition = require("./modules/recognition_tesseract.js");
        // var recognition = require('./modules/recognition_stub.js');
        await recognition.enable();

        var recognition_progress = require("./modules/recognition_progress_material.jsx");
        await recognition_progress.enable();

        var result_popup = require("./modules/result_popup_material.jsx");
        await result_popup.enable();

        var translation_google_translate_tab = require("./modules/translation_google_translate_tab_page.js");
        await translation_google_translate_tab.enable();

        var bubble_recognition = require("./modules/bubble_recognition_opencv.js");
        await bubble_recognition.enable();

        var area_selection = require("./modules/area_selection.js");
        await area_selection.enable();
    } catch (e) {
        logging.error("initialization error", e);
    }
})();