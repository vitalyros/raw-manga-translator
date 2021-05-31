const storage = browser.storage.sync

const TRANSLATION_METHOD_KEY = "translationMethod"
const TRANSLATION_LANGUAGE_KEY = "translationLanguage"

async function get(key) {
    var value = null
    try {
        var data = await storage.get();
        value = data[key]
    } catch (e) {
        console.error("settings get error", key, e)
    }
    return value;
}

async function set(key, value) {
    try { 
        var data = {}
        data[key] = value
        await storage.set(data)
    } catch (e) {
        console.error("settings set error", key, value, e)
    }
}


export async function getDefaultTranslationMethod() {
    return await get(TRANSLATION_METHOD_KEY)
}

export async function setDefaultTranslationMethod(value) {
    console.log("set translation method", value)
    await set(TRANSLATION_METHOD_KEY, value)
}

export async function getDefaultTranslationLanguage() {
    return await get(TRANSLATION_LANGUAGE_KEY)
}

export async function setDefaultTranslationLanguage(value) {
    await set(TRANSLATION_LANGUAGE_KEY, value)
}

