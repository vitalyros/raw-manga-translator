var messaging = require('./modules/messaging.js');
messaging.init(messaging.Location.page);

var message_logger = require('./modules/message_logger.js');
message_logger.init();

var area_selection = require('./modules/area_selection.js');
area_selection.init();

var recongition = require('./modules/recognition_tesseract.js');
recongition.init()

var result_popup = require('./modules/result_popup_material.jsx');
result_popup.init()