var _ = require('underscore');
var Account = require('./account.js');
var constants = require('./const.js');
var log = require('./log.js');
var manager = require('./manager.js');
require('dotenv').config();

/**
 * Client connected to the server
 */
module.exports = function Client(socket) {
	var self = this;
	self.socket = socket;
	self.name = manager.generateID();
	self.state = constants.STATE_NO_AUTH;
	self.authenticated = null;
	self.cycleRequests = 0;
	self.killed = false;

	//Write data to the client
	self.sendMessage = function sendMessage(message) {
		if(self.killed) {
			return;
		}
		log.debug("Sending message to socket <"+self.name+">");
		socket.write(message+";\n");
	};

	//End the connection with the client, sending an optional message
	self.kill = function kill(message) {
		if(self.killed) {
			return;
		}
		log.info("Kicking client <"+self.name+"> with message: " + message);
		if(message) {
			self.sendMessage(message);
		}
		self.killed = true;
		socket.destroy();
		self.cleanup();
	};

	//End any games this client was involved in
	self.cleanup = function cleanup() {
		var clientList = require('./sockets.js').clientList;
		var gameList = require('./sockets.js').gameList;

		log.info("Client  <"+self.name+"> is disconnected. Cleaning up.");
		log.warn("Removing client from global list at index " + _.findIndex(clientList,{name: self.name}));
		//Remove player from global client list
		clientList.splice(_.findIndex(clientList,{name: self.name}),1);

		for(var i=0; i < gameList.length;i++) {
			log.info("Checking game " + gameList[i].name + " with player count " + gameList[i].playersList.length);
			var matchIndex = _.findIndex(gameList[i].playersList,{name: self.name});
			if(matchIndex >= 0) {
				//Notify game that a player has left
				gameList[i].notifyPlayerLeft(self.name);
			}
		}
		manager.runMatchmaking();
		return;
	};

	//Marks this client as authenticated
	self.authenticate = function authenticate(account,key) {
		if(self.killed) {
			return;
		}
		self.authenticated = key;
		self.state = constants.STATE_PENDING;
		log.info("Client <" + self.name + "> authed as <" + account.name + ">");
		self.name = account.name + "_" + self.name;
		manager.runMatchmaking(); //See if any clients are ready to play with
	};

	//Checks if client has passed rate limit
	self.checkLimit = function checkLimit() {
		//Check rate limiting
		if(self.cycleRequests < 0) {
			//Client has already gone over limit
			return true;
		}

		self.cycleRequests += 1;
		if(self.cycleRequests > process.env.RATE_LIMIT) {
			//Block client until next tick
			log.warn("Client <" + self.name + "> passed rate limit.");
			self.cycleRequests = -1;
			self.kill(constants.ERR_RATELIMIT);
			return true;
		}

		return false;
	};

	//Called when client sends data to server
	self.receiveMessage = function readData(data) {

		//Check rate limit
		if(self.checkLimit() || self.killed) {
			return;
		}

		log.debug("Client < " + self.name + "> sent message: "+data);
		var clientWords = data.split(" ");

		//Drop messages without authentication
		if(self.authenticated === null && clientWords[0] !== constants.CCOMMAND_AUTH) {
			//Client is not authenticated, drop mesasge.
			log.debug("Dropping unauthenticated message from client <" + self.name + ">: " + data);
			return;
		}

		switch(clientWords[0]) {
			//AUTH [key]
			case constants.CCOMMAND_AUTH:
				self.handleAuth(clientWords);
				break;

			default:
				log.info("Unknown client command: " + clientWords[0]);
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
			log.warn("Key re-used. Kicking client <" + clientList[dupIndex].name + ">");
			clientList[dupIndex].sendMessage(constants.ERR_AUTH_REUSED);
			clientList[dupIndex].kill();
		}

		Account.findOne({
			key: clientWords[1]
		}).then((result) => {
			if(result) {
				//Auth is accepted
				self.authenticate(result,clientWords[1]);
				self.sendMessage(constants.AUTH_OKAY);
				return;
			} else {
				//Auth is invalid
				self.kill(constants.ERR_AUTH_INVALID);
				return;
			}
		}).catch((e) => {
			log.warn("Auth Error: " + e);
			self.kill(constants.ERR_AUTH_INVALID);
			return;
		});
	};

};
