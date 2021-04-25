var messaging = require('./modules/messaging.js');
messaging.init(messaging.Location.background);

var message_logger = require('./modules/message_logger.js');
message_logger.init();

var context_menu = require('./modules/context_menu.js');
context_menu.init()

var translation = require('./modules/translation_unfriedly_google_translate.js');
translation.init();

var image_capture = require('./modules/image_capture_screenshot.js')
image_capture.init()
