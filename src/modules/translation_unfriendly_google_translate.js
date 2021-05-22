import * as translation from './translation.js';
import * as translate_api from 'google-translate-api-browser';
import * as events from "./events.js";

const module_name = 'translate_unfriendly_google_translate_api';

var enabled = false;

async function onTranslationRequested(event) {
    try {
        if (event.data.translationMethod === translation.TranslationMethod.GoogleTranslateApi) {
            const lang = translation.TranslationLanguages[event.data.translationLanguage]
            var res = await translate_api.translate(event.data.textToTranslate, { from: "ja", to: lang.code })
            await events.fire({
                from: module_name,
                type: events.EventTypes.text_translated,
                data: {
                    textToTranslate: event.data.textToTranslate,
                    translatedText: res.text
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