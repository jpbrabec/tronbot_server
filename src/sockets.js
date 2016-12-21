var clientList = [];
var gameList = [];
var Client = require('./Client.js');
var _ = require('underscore');

module.exports.socketHandler = function (socket) {
	var client = new Client(socket);
	clientList.push(client);


	setTimeout(function(){
		client.sendMessage("Hey client, whats up?");
	},3000);


	socket.on('data',function(data) {
		console.log("Got data: "+data);
	});

	socket.on('end',function(){
		//Remove the client from the list
		console.log("Client connection ended: " + client.name);
		clientList.splice(_.findIndex(clientList,{name: client.name}),1);
	});

	socket.on('error',function(err){
		console.log("Error: "+err);
	})
}

module.exports.clientList = clientList;
module.exports.gameList = gameList;
