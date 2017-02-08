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
	self.friendlyName = "NoName";
	self.state = constants.STATE_NO_AUTH;
	self.authenticated = null;
	self.cycleRequests = 0;
	self.killed = false;
	self.gameName = null;

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

		//Find any games this player was in
		if(self.gameName) {
			var gameIndex = _.findIndex(gameList,{name: self.gameName});
			gameList[gameIndex].notifyPlayerLeft(self.name);
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
		self.friendlyName = account.name; //Non-Unique Human-friendly name
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

			//MOVE [MoveDir]
			case constants.CCOMMAND_MOVE:
				self.handleMove(clientWords);
				break;

			default:
				log.info("Unknown client command: " + clientWords[0]);
				break;
		}
	};

	//Update the win/loss tally in database
	self.updateScore = function updateScore(win) {
		Account.findOne({key: self.authenticated})
		.then((userAccount) => {
			if(win) {
				userAccount.wins += 1;
			} else {
				userAccount.losses += 1;
			}
			//Save changes
			userAccount.save()
			.then((updatedAccount) => {

			}).catch((error) => {
				log.warn("Database error when updating model with auth key <"+self.authenticated+">");
				log.warn(e.stack);			});
		}).catch((e) => {
			log.warn("Database error with auth key <"+self.authenticated+">");
			log.warn(e.stack);
		});
	};

	//Handle client move
	self.handleMove = function handleMove(clientWords) {
		log.info("Client <" + self.name + "> sent a move");
		if(!self.gameName || self.state !== constants.STATE_REQMOVES) {
			//Client was not asked for a move
			log.info("Client <" + self.name + "> tried to make a move while in state " + self.state);
			self.sendMessage(constants.ERR_UNPROMPTED);
			return;
		}
		if(clientWords[1] !== constants.MOVE_UP &&
			clientWords[1] !== constants.MOVE_RIGHT &&
			clientWords[1] !== constants.MOVE_DOWN &&
			clientWords[1] !== constants.MOVE_LEFT ) {
				//This move is invalid
				log.info("Client <" + self.name + "> tried to make an invalid move: " + clientWords[1]);
				self.sendMessage(constants.ERR_MOVE_INVALID);
				return;
			}
		var gameList = require('./sockets.js').gameList;
		var gameIndex = _.findIndex(gameList,{name: self.gameName});
		gameList[gameIndex].notifyPlayerMove(self.name,clientWords[1]);
	};

	//Handle auth attempt.
	self.handleAuth = function handleAuth(clientWords) {


		Account.findOne({
			key: clientWords[1]
		}).then((result) => {
			if(result) {
				//Auth key is legit, but has it been used already?
				var clientList = require('./sockets.js').clientList;
				var dupIndex = _.findIndex(clientList,{authenticated: clientWords[1]});
				if(dupIndex >= 0) {
					log.warn("Key re-used. Kicking client <" + clientList[dupIndex].name + ">");
					clientList[dupIndex].kill(constants.ERR_AUTH_REUSED);
				}
				self.sendMessage(constants.AUTH_OKAY);
				self.authenticate(result,clientWords[1]);
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
