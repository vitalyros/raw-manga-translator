export const TranslationMethod = {
    // Stub: "Stub",
    GoogleTranslateApi: "GoogleTranslateApi",
    GoogleTranslateTab: "GoogleTranslateTab"
}


export const TranslationLanguageList = [
    { name: "Arabic", code: "ar"},
    { name: "Chinese", code: "zh-CN"},
    { name: "English", code: "en"},
    { name: "French", code: "fr"},
    { name: "German", code: "de"},
    { name: "Hindi", code: "hi"},
    { name: "Indonesian", code: "id"},
    { name: "Italian", code: "it"},
    { name: "Portuguese", code: "pt"},
    { name: "Russian", code: "ru"},
    { name: "Spanish", code: "es"},
    { name: "Urdu", code: "ur"}
  ]

export const TranslationLanguages = Object.fromEntries(TranslationLanguageList.map((lang) => {
    return [lang.name, lang]
}));