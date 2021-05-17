import * as translation from './translation.js';
import * as events from "./events.js";
import * as tabs from '../utils/tabs.js'

const module_name = 'translate_google_translate_tab';

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
                from: module_name,
                type: events.EventTypes.text_translated,
                data: {
                    textToTranslate: event.data.textToTranslate,
                    translatedText: event.data.translatedText
                }
             });
        }
    } catch (e) {
        console.error("Failed onTranslationFinished", event, e)
    }
} 

async function onTranslationRequested(event) {
    try {
        if (event.data.serviceName === translation.TranslationMethod.GoogleTranslateTab) {
            activeTab = await tabs.getActiveTab()
            console.log("active tab", activeTab)
            var url = encodeURI(`https://translate.google.com/?sl=ja&tl=en&text=${event.data.textToTranslate}&op=translate`)
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
        console.error("Failed onTranslationRequested", event, e)
    }
}

async function onTranslationEnabled(event) {
    if (pendingTextToTranslate) {
        await events.fire({
            from: module_name,
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
        events.addListener(onTranslationRequested, events.EventTypes.translation_requested)
        events.addListener(onTranslationFinished, events.EventTypes.GoogleTranslateTabTranslationFinished)
        events.addListener(onTranslationEnabled, events.EventTypes.GoogleTranslateTabTranslationEnabled)
        enabled = true
    }
}

export async function disable() {
    if (enabled) {
        events.removeListener(onTranslationRequested, events.EventTypes.translation_requested)
        events.removeListener(onTranslationFinished, events.EventTypes.GoogleTranslateTabTranslationFinished)
        events.removeListener(onTranslationEnabled, events.EventTypes.GoogleTranslateTabTranslationEnabled)
        enabled = false
    }
}