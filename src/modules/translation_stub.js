import * as events from "./events.js";
import * as translation from "../utils/translation";
import {loggingForModule} from "../utils/logging";

const moduleName = "translate_stub";
const logging = loggingForModule(moduleName);

var enabled = false;
var throwError = true;

async function onTranslationRequested(event) {
    try {
        if (event.data.translationMethod === translation.TranslationMethod.Stub) {
            if (throwError) {
                events.fire({
                    from: moduleName,
                    type: events.EventTypes.TranslationFailure,
                    data: {}
                });
            } else {
                const lang = translation.TranslationLanguages[event.data.translationLanguage];
                await events.fire({
                    from: moduleName,
                    type: events.EventTypes.TranslationSuccess,
                    data: {
                        textToTranslate: event.data.textToTranslate,
                        translatedText: `translated ${event.data.textToTranslate} to ${lang.code}`
                    }
                });
            }
        }
    } catch (e) {
        logging.error("Failed onTranslationRequested", event, e);
    }
}

export async function enable() {
    if (!enabled) {
        events.addListener(onTranslationRequested, events.EventTypes.TranslationRequested);
        enabled = true;
        logging.debug("module enabled");
    }
}

export async function disable() {
    if (enabled) {
        events.removeListener(onTranslationRequested, events.EventTypes.TranslationRequested);
        enabled = false;
        logging.debug("module enabled");
    }
}