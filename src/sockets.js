var clientList = [];
var gameList = [];
var Client = require('./Client.js');

module.exports.socketHandler = function (socket) {
	var client = new Client(socket);
	var clientData = "";
	clientList.push(client);
	client.sendMessage("REQUEST_KEY");

	//TODO- Add user auth, kick when multiple accounts with same key

	socket.on('data',function(data) {
		console.log("Raw Data: <" + data + ">");
		clientData += data.toString();
		var endIndex = clientData.indexOf(';');

		//Process each message seperately
		while(endIndex > -1) {
			var message = clientData.substring(0,endIndex);
			client.receiveMessage(message);
			clientData = clientData.substring(endIndex+1);
			endIndex = clientData.indexOf(";");
		}

	});

	socket.on('end',function(){
		//Client ended the connection. Remove from list.
		console.log("Client ended connection: " + client.name);
		client.cleanup();
	});

	socket.on('error',function(err){
		console.log("Socket Error on client < " + client.name + ">: "+err + ".\nEnding Connection.");
		client.kill();
	});
};

module.exports.clientList = clientList;
module.exports.gameList = gameList;
