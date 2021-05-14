(async() => {
    try {
        var events = require('./modules/events.js');
        await events.enable(events.Location.Background);

        var message_logger = require('./modules/message_logger.js');
        await message_logger.enable();

        var context_menu = require('./modules/context_menu.js');
        await context_menu.enable()

        var translation_stub = require('./modules/translation_stub.js');
        await translation_stub.enable();
        
        var translation_unfriendly_google_translate = require('./modules/translation_unfriendly_google_translate.js');
        await translation_unfriendly_google_translate.enable();

        var translation_google_translate_tab = require('./modules/translation_google_translate_tab_browser.js');
        await translation_google_translate_tab.enable();

        var image_capture = require('./modules/image_capture_screenshot.js')
        await image_capture.enable()

        // var page_capture = require('./modules/page_capture_screenshot.js')
        // await page_capture.enable()
    } catch (e) {
        console.error("romatora initialization error", e)
    }
})();
