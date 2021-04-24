var messaging = require('./messaging.js');

const select_area_menu_id = 'romatora-image-selection'
const select_area_menu_title = 'Select area to translate'

var enabled = false;

function onSelectAreaToTranslateClick() {
    messaging.send({
        type: messaging.MessageTypes.select_area_to_translate,
        data: {}
    })
}



function reset() {

}


function enable() {
    if (!enabled) {
        browser.menus.remove(select_area_menu_id)
        browser.menus.create(
            {
                id: select_area_menu_id,
                title: select_area_menu_title,
                contexts: ['page', 'image'],
                onclick: onSelectAreaToTranslateClick()
            }
          )
        enabled = true
    }
}

function disable() {
    if (enabled) {
        messaging.addListener('reset', reset)
        browser.menus.remove(select_area_menu_id)
        enabled = false
    }
}

module.exports.disable = disable;
module.exports.init = enable;
module.exports.enable = enable;

