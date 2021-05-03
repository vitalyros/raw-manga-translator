(async() => {
    try {
        var events = require('./modules/events.js');
        await events.enable(events.Location.Page);

        var message_logger = require('./modules/message_logger.js');
        await message_logger.enable();

        var recongition = require('./modules/recognition_tesseract.js');
        await recongition.enable()

        var result_popup = require('./modules/result_popup_material.jsx');
        await result_popup.enable()

        var area_selection = require('./modules/area_selection.js');
        await area_selection.enable();

        var hocr_display = require('./modules/hocr_display.jsx');
        await hocr_display.enable()
    } catch (e) {
        console.error("romatora initialization error", e)
    }
})();