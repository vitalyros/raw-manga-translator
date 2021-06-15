import * as translation from '../utils/translation';
import * as translate_api from 'google-translate-api-browser';
import * as events from "./events.js";

const moduleName = 'translate_unfriendly_google_translate_api';

var enabled = false;

async function onTranslationRequested(event) {
    try {
        if (event.data.translationMethod === translation.TranslationMethod.GoogleTranslateApi) {
            const lang = translation.TranslationLanguages[event.data.translationLanguage]
            var res = await translate_api.translate(event.data.textToTranslate, { from: "ja", to: lang.code })
            await events.fire({
                from: moduleName,
                type: events.EventTypes.TranslationSuccess,
                data: {
                    textToTranslate: event.data.textToTranslate,
                    translatedText: res.text
                }
            });
        }
    } catch (e) {
        events.fire({
            from: moduleName,
            type: events.EventTypes.TranslationFailure,
            data: {
                exception: e
            }
        });
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