(async() => {
    try {
        var events = require('./modules/events.js');
        await events.enable(events.Location.Background);

        var message_logger = require('./modules/message_logger.js');
        await message_logger.enable();

        var context_menu = require('./modules/context_menu.js');
        await context_menu.enable()

        // var translation = require('./modules/translation_unfriedly_google_translate.js');
        // await translation.enable();

        // var image_capture = require('./modules/image_capture_screenshot.js')
        // await image_capture.enable()
    } catch (e) {
        console.error("romatora initialization error", e)
    }
})();
