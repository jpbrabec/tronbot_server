var _ = require('underscore');

/**
 * Client connected to the server
 */
module.exports = function Client(socket) {
	var self = this;
	self.socket = socket;
	self.name = socket.remoteAddress+":"+socket.remotePort;
	self.status = "STATUS_PENDING";

	//Write data to the client
	self.sendMessage = function sendMessage(message) {
		console.log("Sending message to socket <"+self.name+">");
		socket.write(message+"\n");
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
		throw "TODO- Kill any games client was involved in";
	};
};
