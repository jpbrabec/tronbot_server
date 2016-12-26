var http = require('http');
var net = require('net');
var tickHandler = require('./src/manager.js').tickHandler;
var sockets = require('./src/sockets.js');
var viewer = require('./src/viewer.js');
var mongoose = require('mongoose');
var log = require('./src/log.js');
var WebSocketServer = require('websocket').server;
require('dotenv').config();

mongoose.Promise = Promise; //Use ES6 Promises

//Connect to database
mongoose.connect(process.env.MONGO_URL)
.then((err) => {
    log.info("Mongoose Connected");
}).catch((e) => {
    log.error("Mongoose ERROR: " + e);
});

//TCP Socket Server for bots
var server = net.createServer(sockets.socketHandler);
var port = process.env.PORT_CLIENT || 8080;
server.listen(port, () => {
    log.info("Server listening on port " + port);
});


//HTTP Server for viewer
var portViewer = process.env.PORT_VIEWER || 8081;
var server = http.createServer(function(req,res) {
  console.log("Got req for "+req.url);
  res.writeHead(404);
  res.end();
});
server.listen(portViewer, () => {
    log.info("Viewer Server listening on port " + portViewer);
});
//Upgrade to WebSocket protocol
wsServer = new WebSocketServer({
  httpServer: server,
  autoAcceptConnections: false
});
wsServer.on('request',viewer.handler);


//Start tick handler for rate limiting
setInterval(tickHandler,1000);
