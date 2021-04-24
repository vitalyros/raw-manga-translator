var messaging = require('./messaging.js');
messaging.init(messaging.Location.page);
messaging.addListener((message) => { console.log("message: ", message)})
messaging.send({ type: "page", data: "hello from page"})
