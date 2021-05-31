import * as events from './events.js';
import * as translation from './translation.js';

const module_name = 'translate_stub';

var enabled = false;
var throwError = true;

async function onTranslationRequested(event) {
    try {
        if (event.data.translationMethod === translation.TranslationMethod.Stub) {
            if (throwError) {
                events.fire({
                    from: module_name,
                    type: events.EventTypes.TranslationFailure,
                    data: {}
                });
            } else {
                const lang = translation.TranslationLanguages[event.data.translationLanguage]
                await events.fire({
                    from: module_name,
                    type: events.EventTypes.TranslationSuccess,
                    data: {
                        textToTranslate: event.data.textToTranslate,
                        translatedText: `translated ${event.data.textToTranslate} to ${lang.code}`
                    }
                });
            }
        }
    } catch (e) {
        console.error("Failed onTranslationRequested", event, e)
    }
}

export async function enable() {
    if (!enabled) {
        events.addListener(onTranslationRequested, events.EventTypes.TranslationRequested)
        enabled = true
    }
}

export async function disable() {
    if (enabled) {
        events.removeListener(onTranslationRequested, events.EventTypes.TranslationRequested)
        enabled = false
    }
}