import * as translation from './translation.js';
import * as events from "./events.js";
import SelectInput from '@material-ui/core/Select/SelectInput';
import * as tabs from '../utils/tabs.js'

const module_name = 'translate_google_translate_tab';

var enabled = false;

//  // var gtt = getGoogleTranslateTab()
//  var uri = encodeURI(`https://translate.google.com/?sl=ja&tl=en&text=${text}&op=translate`)
//  // var code = `window.open("${uri}","${gtt.id}");`
//  console.log(`request in google tranlated tab: ${uri}`)
//  // googleTranslateTab = await browser.tabs.create(
//    // { active: false, url: uri });
//  // browser.tabs.executeScript(gtt.id, {
//  //   code: code
//  // })   
var googleTranslateTab = null;

async function waitForTabCompletion(tab) {
    var second = 0;
    var maxSeconds = 5;
    while (tab.status !== "complete" && second < maxSeconds) {
        console.log("awating for tab completion");
        await new Promise(r => setTimeout(r, 1000));
        second += 1;
    } 
    return tab.status !== "complete"
}

async function onTranslationRequested(event) {
    try {
        if (event.data.serviceName === translation.TranslationService.GoogleTranslateTab) {
            var activeTab = await tabs.getActiveTab()
            console.log("active tab", activeTab)
            var url = encodeURI(`https://translate.google.com/?sl=ja&tl=en&text=${event.data.textToTranslate}&op=translate`)
            if (googleTranslateTab == null) {
                googleTranslateTab = await browser.tabs.create(
                    { active: true, url: url });
            } else {
                await browser.tabs.update(googleTranslateTab.id, { active: true, url: url });
            }
            var completed = waitForTabCompletion(googleTranslateTab)
            await new Promise(r => setTimeout(r, 3000));
            if (completed) {
                console.log("tab complete")
                var queryCode = `document.querySelectorAll('c-wiz > div > div > div > span > span > span')[0].innerHTML;`
                var result = await browser.tabs.executeScript(googleTranslateTab.id, {
                    code: queryCode
                  })
                var text = result[0]
                if (text && activeTab) {
                    await browser.tabs.update(activeTab.id, {
                        active: true
                    })
                    await events.fire({
                        from: module_name,
                        type: events.EventTypes.text_translated,
                        data: {
                            textToTranslate: event.data.textToTranslate,
                            translatedText: text
                        }
                     });
                }
            } else {
                console.log("tab timeouted")
            }
            // while (googleTranslateTab.status !== "complete") {
            //     await timeout(1000);
            // } 
            // console.log("complete")
            // $$('c-wiz > div > div > div > span > span > span')[0].innerHTML
            // var res = await translate_api.translate(event.data.textToTranslate, { to: "en" })
            // await events.fire({
            //     from: module_name,
            //     type: events.EventTypes.text_translated,
            //     data: {
            //         textToTranslate: event.data.textToTranslate,
            //         translatedText: res.text
            //     }
            // });
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