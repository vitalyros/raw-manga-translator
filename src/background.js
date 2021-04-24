var messaging = require('./messaging.js');
messaging.init(messaging.Location.background);
messaging.addListener((message) => { console.log("message: ", message)})
messaging.send({ type: "background", data: "hello from background"})


var context_menu = require('./context_menu.js');
context_menu.init()