import { ContactsOutlined } from "@material-ui/icons";

export const TranslationMethod = {
    Stub: "Stub",
    GoogleTranslateApi: "GoogleTranslateApi",
    GoogleTranslateTab: "GoogleTranslateTab"
}


export const TranslationLanguageList = [
    { name: "Russian", code: "ru"},
    { name: "English", code: "en"},
    { name: "Italian", code: "it"}
  ]

export const TranslationLanguages = Object.fromEntries(TranslationLanguageList.map((lang) => {
    return [lang.name, lang]
}));

console.log("translationLanguages", TranslationLanguages)