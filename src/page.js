(async() => {
    try {
        var events = require('./modules/events.js');
        await events.enable(events.Location.Page);

        var message_logger = require('./modules/message_logger.js');
        await message_logger.enable();

        var recongition = require('./modules/recognition_tesseract.js');
        await recongition.enable()

        // var page_recongition = require('./modules/page_recognition_tesseract.js');
        // await page_recongition.enable()

        var recognition_progress = require('./modules/recognition_progress_material.jsx');
        await recognition_progress.enable()

        var result_popup = require('./modules/result_popup_material.jsx');
        await result_popup.enable()

        var area_selection = require('./modules/area_selection.js');
        await area_selection.enable();

        var translation_google_translate_tab = require('./modules/translation_google_translate_tab_page.js');
        await translation_google_translate_tab.enable();
        // var hocr_display = require('./modules/hocr_display.jsx');
        // await hocr_display.enable()
        // await new Promise(r => setTimeout(r, 5000));
        // if (!document.hidden) {
        //     events.fire({
        //         from: 'page initialization',
        //         type: events.EventTypes.PageInitialized,
        //         data: {
        //             height: window.innerHeight,
        //             width: window.innerWidth,
        //         }
        //     })
        // }
    } catch (e) {
        console.error("romatora initialization error", e)
    }
})();