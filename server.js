var net = require('net');
var tickHandler = require('./src/manager.js').tickHandler;
var sockets = require('./src/sockets.js');
var mongoose = require('mongoose');
var log = require('./src/log.js');
require('dotenv').config();

mongoose.Promise = Promise; //Use ES6 Promises

//Connect to database
mongoose.connect(process.env.MONGO_URL)
.then((err) => {
    log.info("Mongoose Connected");
}).catch((e) => {
    log.error("Mongoose ERROR: " + e);
});

var server = net.createServer(sockets.socketHandler);
var port = process.env.PORT || 8080;
server.listen(port, () => {
    log.info("Server listening on port " + port);
});


setInterval(tickHandler,1000);
