import {TranslationMethod, TranslationLanguages} from "./translation";
import { loggingForModule } from "./logging";

const logging = loggingForModule("settings");
const storage = browser.storage.sync;

const TRANSLATION_METHOD_KEY = "translationMethod";
const TRANSLATION_LANGUAGE_KEY = "translationLanguage";
const DEBUG_ENABLED = "debugEnabled";

async function getWithDefaultValue(key, defaultValue) {
    const value = get(key);
    if (value === null || typeof value === "undefined") {
        return defaultValue;
    } else {
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


export async function getDefaultTranslationMethod() {
    return await getWithDefaultValue(TRANSLATION_METHOD_KEY, TranslationMethod.GoogleTranslateApi);
}

export async function setDefaultTranslationMethod(value) {
    await set(TRANSLATION_METHOD_KEY, value);
}

export async function getDefaultTranslationLanguage() {
    return await getWithDefaultValue(TRANSLATION_LANGUAGE_KEY, TranslationLanguages.English,name);
}

export async function setDefaultTranslationLanguage(value) {
    await set(TRANSLATION_LANGUAGE_KEY, value);
}

export async function getDebugEnabled() {
    return await getWithDefaultValue(DEBUG_ENABLED, false);
}

export async function setDebugEnabled(value) {
    await set(DEBUG_ENABLED, value);
}