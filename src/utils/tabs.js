export async function getActiveTab() {
    var tabs = await browser.tabs.query({active: true, currentWindow: true, discarded: false, windowType: 'normal'});
    for (let tab of tabs) {
        if (typeof tab.url !== 'undefined') {
            return tab
        }
    };
    return null
}