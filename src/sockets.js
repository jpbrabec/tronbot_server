var clientList = [];
var gameList = [];
var Client = require('./client.js');
var constants = require('./const.js');
var log = require('./log.js');

module.exports.socketHandler = function (socket) {
	var client = new Client(socket);
	var clientData = "";
	clientList.push(client);
	client.sendMessage(constants.SCOMMAND_REQUEST_KEY);


	socket.on('data',function(data) {
		clientData += data.toString();
		var endIndex = clientData.indexOf(';');

		//Is message longer than allowed
		if(endIndex > process.env.LENGTH_LIMIT) {
			log.warn("Client <" + client.name + "> passed rate limit.");
			client.kill(constants.ERR_LENGTHLIMIT);
			return;
		}

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
		log.info("Client ended connection: " + client.name);
		client.kill();
	});

	socket.on('error',function(err){
		log.warn("Socket Error on client < " + client.name + ">: "+err + ".\nEnding Connection.");
		client.kill();
	});
};

module.exports.clientList = clientList;
module.exports.gameList = gameList;
