import { TranslationMethod } from "./translation";

const storage = browser.storage.sync


async function get(key) {
    var value = null
    try {
        var data = await storage.get();
        value = data[key]
    } catch (e) {
        console.error("settings get error", key, e)
    }
    console.log("settings get", key, value)
    return value;
}

async function set(key, value) {
    try { 
        var data = {}
        data[key] = value
        console.log("settings set", key, value)
        await storage.set(data)
    } catch (e) {
        console.error("settings set error", key, value, e)
    }
}


export async function getDefaultTranslationMethod() {
    return await get("translationMethod")
}

export async function setDefaultTranslationMethod(value) {
    var key = "translationMethod";
    await set(key, value)
}

export async function getDefaultTranslationLanguage() {
    return await get("translationLanguage")
}

export async function setDefaultTranslationLanguage(value) {
    var key = "translationLanguage";
    await set(key, value)
}

