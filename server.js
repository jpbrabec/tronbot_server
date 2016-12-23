var net = require('net');
var tickHandler = require('./src/tick.js');
var sockets = require('./src/sockets.js');
var mongoose = require('mongoose');
require('dotenv').config();

mongoose.Promise = Promise; //Use ES6 Promises

//Connect to database
mongoose.connect(process.env.MONGO_URL)
.then((err) => {
    console.log("Mongoose Connected");
}).catch((e) => {
    console.log("Mongoose ERROR: " + e);
});

var server = net.createServer(sockets.socketHandler);
server.listen(8081);


setInterval(tickHandler,2000);
