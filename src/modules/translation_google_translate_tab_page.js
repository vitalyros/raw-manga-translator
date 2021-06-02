import * as events from "./events.js";

const module_name = 'translate_google_translate_tab_page';

var enabled = false;

function isGoogleTranslate() {
    return window.location.href.includes('translate.google.com')
}

async function onTranslationRequested(event) {
    try {
        if (isGoogleTranslate()) {
            var interval = 0;
            var maxIntervals = 50;
            while (interval < maxIntervals) {
                await new Promise(r => setTimeout(r, 200));
                var resultElements = document.querySelectorAll('c-wiz > div > div > div > span > span > span')
                if (resultElements.length > 0) {
                    var translatedText = Array.from(resultElements).slice(0, -1).map((elem) => elem.innerHTML).join('');
                    await events.fire({
                        from: module_name,
                        type: events.EventTypes.GoogleTranslateTabTranslationFinished,
                        data: {
                            textToTranslate: event.data.textToTranslate,
                            translatedText: translatedText
                        }
                    });
                    return
                }
                interval += 1;
            }
            await events.fire({
                from: module_name,
                type: events.EventTypes.GoogleTranslateTabTranslationFinished,
                data: {
                    textToTranslate: event.data.textToTranslate,
                    timeout: true
                }
            });
        } else {
            console.error("current page is not a google translate page")
        }
    } catch (e) {
        events.fire({
            from: module_name,
            type: events.EventTypes.TranslationFailure,
            data: {
                reason: "code for google translate page failed",
                exception: e
            }
        });
    }
}

export async function enable() {
    if (!enabled) {
        events.addListener(onTranslationRequested, events.EventTypes.GoogleTranslateTabTranslationRequested)
        enabled = true
        if (isGoogleTranslate()) {
            await events.fire({
                from: module_name,
                type: events.EventTypes.GoogleTranslateTabTranslationEnabled,
                data: {}
            });
        }
    }
}

export async function disable() {
    if (enabled) {
        events.removeListener(onTranslationRequested, events.EventTypes.GoogleTranslateTabTranslationRequested)
        enabled = false
    }
}