var messaging = require('./messaging.js');

const module_name = 'image_capture_screenshot'
var enabled = false;

function logError(...arg) {
    console.error("Error: ", ...arg);
}

function onAreaSelected(message) {
    var box = message.data.box
    var detail = {
      quality: 100,
      rect: {
        x: box.x_scrolled,
        y: box.y_scrolled,
        width: box.width,
        height: box.height
      }
    }
    var capturing = browser.tabs.captureVisibleTab(null, detail);
    capturing.then(
      function(image_uri) { 
        messaging.send({
            from: module_name,
            type: messaging.MessageTypes.image_captured,
            data: {
                box: box,
                image_uri: image_uri
            }
        });
      }, logError);
}

function enable() {
    if (!enabled) {
        messaging.addListener(onAreaSelected, messaging.MessageTypes.area_selected)
        enabled = true
    }
}

function disable() {
    if (enabled) {
        messaging.removeListener(onAreaSelected, messaging.MessageTypes.area_selected)
        enabled = false
    }
}

module.exports.disable = disable;
module.exports.init = enable;
module.exports.enable = enable;