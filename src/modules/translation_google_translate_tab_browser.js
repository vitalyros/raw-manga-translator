import * as translation from '../utils/translation';
import * as events from "./events.js";
import * as tabs from '../utils/tabs.js'

const moduleName = 'translate_google_translate_tab';

var enabled = false;

var googleTranslateTab = null;
var activeTab = null;
var pendingTextToTranslate = null;

async function onTranslationFinished(event) {
    try {
        if (activeTab) {
            await browser.tabs.update(activeTab.id, {
                active: true
            })
        }
        if (event.data.translatedText) {
            await events.fire({
                from: moduleName,
                type: events.EventTypes.TranslationSuccess,
                data: {
                    textToTranslate: event.data.textToTranslate,
                    translatedText: event.data.translatedText
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

async function onTranslationRequested(event) {
    try {
        if (event.data.translationMethod === translation.TranslationMethod.GoogleTranslateTab) {
            activeTab = await tabs.getActiveTab()
            const lang = translation.TranslationLanguages[event.data.translationLanguage]
            var url = encodeURI(`https://translate.google.com/?sl=ja&tl=${lang.code}&text=${event.data.textToTranslate}&op=translate`)
            if (googleTranslateTab) {
                try {
                    googleTranslateTab = await browser.tabs.get(googleTranslateTab.id)
                } catch (e) {
                    googleTranslateTab = null;
                }
            }
            pendingTextToTranslate = event.data.textToTranslate
            if (googleTranslateTab) {
                await browser.tabs.update(googleTranslateTab.id, { active: true, url: url });
            } else {
                googleTranslateTab = await browser.tabs.create(
                    { active: true, url: url });
            }
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

async function onTranslationEnabled(event) {
    if (pendingTextToTranslate) {
        await events.fire({
            from: moduleName,
            type: events.EventTypes.GoogleTranslateTabTranslationRequested,
            data: {
                textToTranslate: pendingTextToTranslate,
            }
         });
         pendingTextToTranslate = null;
    }
}

export async function enable() {
    if (!enabled) {
        events.addListener(onTranslationRequested, events.EventTypes.TranslationRequested)
        events.addListener(onTranslationFinished, events.EventTypes.GoogleTranslateTabTranslationFinished)
        events.addListener(onTranslationEnabled, events.EventTypes.GoogleTranslateTabTranslationEnabled)
        enabled = true
        logging.debug("module enabled")
    }
}

export async function disable() {
    if (enabled) {
        events.removeListener(onTranslationRequested, events.EventTypes.TranslationRequested)
        events.removeListener(onTranslationFinished, events.EventTypes.GoogleTranslateTabTranslationFinished)
        events.removeListener(onTranslationEnabled, events.EventTypes.GoogleTranslateTabTranslationEnabled)
        enabled = false
        logging.debug("module disabled")
    }
}