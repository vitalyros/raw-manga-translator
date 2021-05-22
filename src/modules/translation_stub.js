import * as events from './events.js';
import * as translation from './translation.js';

const module_name = 'translate_stub';

var enabled = false;

async function onTranslationRequested(event) {
    try {
        if (event.data.translationMethod === translation.TranslationMethod.Stub) {
            const lang = translation.TranslationLanguages[event.data.translationLanguage]
            await events.fire({
                from: module_name,
                type: events.EventTypes.text_translated,
                data: {
                    textToTranslate: event.data.textToTranslate,
                    translatedText: `translated ${event.data.textToTranslate} to ${lang.code}`
                }
            });
        }
    } catch (e) {
        console.error("Failed onTranslationRequested", event, e)
    }
}

export async function enable() {
    if (!enabled) {
        events.addListener(onTranslationRequested, events.EventTypes.translation_requested)
        enabled = true
    }
}

export async function disable() {
    if (enabled) {
        events.removeListener(onTranslationRequested, events.EventTypes.translation_requested)
        enabled = false
    }
}