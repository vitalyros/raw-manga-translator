import * as events from "./events.js";
import { loggingForModule } from "../utils/logging";

const moduleName = "translate_google_translate_tab_page";
const logging = loggingForModule(moduleName);
var enabled = false;

function isGoogleTranslate() {
    return window.location.href.includes("translate.google.com");
}

async function onTranslationRequested(event) {
    try {
        if (isGoogleTranslate()) {
            var interval = 0;
            var maxIntervals = 50;
            while (interval < maxIntervals) {
                await new Promise(r => setTimeout(r, 200));
                var resultElements = document.querySelectorAll("c-wiz > div > div > div > span > span > span");
                if (resultElements.length > 0) {
                    var translatedText = Array.from(resultElements).slice(0, -1).map((elem) => elem.innerHTML).join("");
                    await events.fire({
                        from: moduleName,
                        type: events.EventTypes.GoogleTranslateTabTranslationFinished,
                        data: {
                            textToTranslate: event.data.textToTranslate,
                            translatedText: translatedText
                        }
                    });
                    return;
                }
                interval += 1;
            }
            await events.fire({
                from: moduleName,
                type: events.EventTypes.GoogleTranslateTabTranslationFinished,
                data: {
                    textToTranslate: event.data.textToTranslate,
                    timeout: true
                }
            });
        } else {
            logging.error("current page is not a google translate page");
        }
    } catch (e) {
        events.fire({
            from: moduleName,
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
        events.addListener(onTranslationRequested, events.EventTypes.GoogleTranslateTabTranslationRequested);
        enabled = true;
        if (isGoogleTranslate()) {
            await events.fire({
                from: moduleName,
                type: events.EventTypes.GoogleTranslateTabTranslationEnabled,
                data: {}
            });
        }
        logging.debug("module enabled");
    }
}

export async function disable() {
    if (enabled) {
        events.removeListener(onTranslationRequested, events.EventTypes.GoogleTranslateTabTranslationRequested);
        enabled = false;
        logging.debug("module disabled");
    }
}