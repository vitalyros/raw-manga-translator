var messaging = require('./messaging.js');

const module_name = 'context_menu';

const menu_item_id = 'romatora-main-menu-item';
const select_title = 'Select area to translate';
const cancel_title = 'Cancel area selection';

var enabled = false;


function onSelectAreaClick() {
    browser.menus.update(menu_item_id,
         {
        title: cancel_title,
        onclick: onCancelSelectionClick
    });
    messaging.send({
        type: messaging.MessageTypes.start_select_area,
        from: module_name,
        data: {}
    })
}

function onCancelSelectionClick() {
    browser.menus.update(menu_item_id,
        {
            title: select_title,
            onclick: onSelectAreaClick
        });
    messaging.send({
        type: messaging.MessageTypes.cancel_select_area,
        from: module_name,
        data: {}
    })
}

function reset() {
    browser.menus.update(menu_item_id,
        {
            title: select_title,
            onclick: onSelectAreaClick
        });
}

function enable() {
    if (!enabled) {
        browser.menus.remove(menu_item_id)
        browser.menus.create( {
            id: menu_item_id,
            title: select_title,
            contexts: ['page', 'image'],
            onclick: onSelectAreaClick
        })    
        messaging.addListener(reset, messaging.MessageTypes.area_selected)   
        messaging.addListener(reset, messaging.MessageTypes.reset_translation)      
        enabled = true
    }
}

function disable() {
    if (enabled) {
        browser.menus.remove(menu_item_id)
        messaging.removeListener(reset, messaging.MessageTypes.area_selected)      
        messaging.removeListener(reset, messaging.MessageTypes.reset_translation)      
        enabled = false
    }
}

module.exports.disable = disable;
module.exports.init = enable;
module.exports.enable = enable;