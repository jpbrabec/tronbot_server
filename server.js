var net = require('net');
var tickHandler = require('./src/tick.js');
var sockets = require('./src/sockets.js');


var server = net.createServer(sockets.socketHandler);
server.listen(8081);


setInterval(tickHandler,2000);
