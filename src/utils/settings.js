import {TranslationMethod, TranslationLanguages} from "./translation";
import { loggingForModule } from "./logging";

const logging = loggingForModule("settings");
const storage = browser.storage.sync;

export const TRANSLATION_METHOD_KEY = "translationMethod";
export const TRANSLATION_LANGUAGE_KEY = "translationLanguage";
export const DEBUG_LOGGING_ENABLED = "debugLoggingEnabled";
export const DEBUG_BUBBLE_RECOGNITION = "debugBubbleRecognition";
export const UI_SCALE = "uiScale";

const keys = [
    TRANSLATION_METHOD_KEY,
    TRANSLATION_LANGUAGE_KEY,
    DEBUG_LOGGING_ENABLED,
    DEBUG_BUBBLE_RECOGNITION,
    UI_SCALE,
];

const defaultValues = {};
defaultValues[TRANSLATION_METHOD_KEY] = TranslationMethod.GoogleTranslateApi;
defaultValues[TRANSLATION_LANGUAGE_KEY] = TranslationLanguages.English.name;
defaultValues[DEBUG_LOGGING_ENABLED] = false;
defaultValues[DEBUG_BUBBLE_RECOGNITION] = false;
defaultValues[UI_SCALE] = 2.0;

async function getWithDefaultValue(key) {
    const value = await get(key);
    if (typeof value === "undefined" || value === null) {
        let defaultValue = defaultValues[key];
        logging.debug("returning default value", key, defaultValue, value, typeof value);
        return defaultValue;
    } else {
        logging.debug("returning value", key, value);
        return value;
    }
}

async function get(key) {
    var value = null;
    try {
        var data = await storage.get();
        value = data[key];
    } catch (e) {
        logging.error("settings get error", key, e);
    }
    return value;
}

async function set(key, value) {
    try { 
        var data = {};
        data[key] = value;
        await storage.set(data);
    } catch (e) {
        logging.error("settings set error", key, value, e);
    }
}

function addDefaultValue(data, key) {
    let value = data[key];
    if (typeof value === "undefined" || value === null) {
        let defaultValue = defaultValues[key];
        logging.debug("populating with default value", key, defaultValue, value, typeof value);
        data[key] = defaultValue;
    }
}

export async function getAll() {
    try {
        let data = await storage.get();
        keys.forEach(key => {
            addDefaultValue(data, key);
        });
        return data;
    } catch (e) {
        logging.error("settings get all error, returning default", e, defaultValues);
        return defaultValues;
    }
}

export async function setAll(data) {
    await storage.set(data);
}

export async function getDebugBubbleRecogniton() {
    return await getWithDefaultValue(DEBUG_BUBBLE_RECOGNITION);
}

export async function getDefaultTranslationMethod() {
    return await getWithDefaultValue(TRANSLATION_METHOD_KEY);
}

export async function setDefaultTranslationMethod(value) {
    await set(TRANSLATION_METHOD_KEY, value);
}

export async function getDefaultTranslationLanguage() {
    return await getWithDefaultValue(TRANSLATION_LANGUAGE_KEY);
}

export async function setDefaultTranslationLanguage(value) {
    await set(TRANSLATION_LANGUAGE_KEY, value);
}

export async function getDebugEnabled() {
    return await getWithDefaultValue(DEBUG_LOGGING_ENABLED);
}

export async function getUiScale() {
    return await getWithDefaultValue(UI_SCALE);
}
