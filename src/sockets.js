var clientList = [];
var gameList = [];
var Client = require('./Client.js');

module.exports.socketHandler = function (socket) {
	var client = new Client(socket);
	clientList.push(client);
	client.sendMessage("Hello World");


	socket.on('data',function(data) {
		console.log("Got data: "+data);
	});

	socket.on('end',function(){
		//Client ended the connection. Remove from list.
		console.log("Client ended connection: " + client.name);
		client.cleanup();
	});

	socket.on('error',function(err){
		console.log("Error: "+err);
	});
};

module.exports.clientList = clientList;
module.exports.gameList = gameList;
