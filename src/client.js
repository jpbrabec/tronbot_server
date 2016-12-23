var _ = require('underscore');
var Account = require('./account.js');

/**
 * Client connected to the server
 */
module.exports = function Client(socket) {
	var self = this;
	self.socket = socket;
	self.name = socket.remoteAddress+":"+socket.remotePort;
	self.status = "STATUS_NO_AUTH";
	self.authenticated = null;

	//Write data to the client
	self.sendMessage = function sendMessage(message) {
		console.log("Sending message to socket <"+self.name+">");
		socket.write(message+";\n");
	};

	//End the connection with the client
	self.kill = function kill() {
		console.log("Kicking client <"+self.name+">");
		socket.destroy();
		self.cleanup();
	};

	//End any games this client was involved in
	self.cleanup = function cleanup() {
		var clientList = require('./sockets.js').clientList;
		var gameList = require('./sockets.js').gameList;

		console.log("Client  <"+self.name+"> is disconnected. Cleaning up.");
		clientList.splice(_.findIndex(clientList,{name: self.name}),1);

		//TODO Kill any games this client was involved in
		// throw "TODO- Kill any games client was involved in";
	};

	//Marks this client as authenticated
	self.authenticate = function authenticate(account,key) {
		self.authenticated = key;
		self.status = "STATUS_PENDING";
		console.log("Client <" + self.name + "> authed as <" + account.name + ">");
		self.name = account.name + "_" + self.name;
	};

	//Called when client sends data to server
	self.receiveMessage = function readData(data) {
		console.log("Client < " + self.name + "> sent message: "+data);
		var clientWords = data.split(" ");

		//Drop messages without authentication
		if(self.authenticated === null && clientWords[0] !== "AUTH") {
			//Client is not authenticated, drop mesasge.
			console.log("Dropping unauthenticated message from client <" + self.name + ">: " + data);
			return;
		}

		switch(clientWords[0]) {
			//AUTH [key]
			case "AUTH":
				self.handleAuth(clientWords);
				break;

			default:
				console.log("Unknown client state: " + self.status);
				break;
		}
	};

	//Handle auth attempt.
	self.handleAuth = function handleAuth(clientWords) {
		//Is this key in use already?
		var clientList = require('./sockets.js').clientList;
		var dupIndex = _.findIndex(clientList,{authenticated: clientWords[1]});

		//Was this key already in use?
		if(dupIndex >= 0) {
			console.log("Key re-used. Kicking client <" + clientList[dupIndex].name + ">");
			clientList[dupIndex].sendMessage("ERROR KEY_REUSED");
			clientList[dupIndex].kill();
		}

		Account.findOne({
			key: clientWords[1]
		}).then((result) => {
			if(result) {
				self.authenticate(result,clientWords[1]);
				self.sendMessage("AUTH_VALID");
				return;
			} else {
				self.sendMessage("ERROR AUTH_INVALID");
				self.kill();
				return;
			}
		}).catch((e) => {
			console.log("Auth Error: " + e);
			self.sendMessage("ERROR AUTH_INVALID");
			self.kill();
			return;
		});
	};

};
