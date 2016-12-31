var manager = require('./manager.js');
var constants = require('./const.js');
var log = require('./log.js');
var _ = require('underscore');

/**
 * Viewer connected to the server
 */
module.exports = function Viewer(connection) {
	var self = this;
	self.connection = connection;
	self.name = manager.generateID();
	self.killed = false;
	self.gameName = null;

  log.info("Viewer Connected: " + self.name);

	//Write data to the client
	self.sendMessage = function sendMessage(message) {
		if(self.killed) {
			return;
		}
    self.connection.sendUTF(message + ";");
	};

  //Handle an incoming message
  self.receiveMessage = function receiveMessage(message) {
    log.debug(self.name + ": Got message: " + message);

		//Remove last semicolon charaacter
		endIndex = message.indexOf(";");
		message = message.substring(0,endIndex);

		var messageWords = message.split(" ");
		switch(messageWords[0]) {
			case constants.VCOMMAND_SUBSCRIBE:
				self.handleSubscribe(messageWords);
				break;

			default:
				log.warn(self.name + ": Unknown viewer message: " + message);
				break;
		}
  };

	self.handleSubscribe = function handleSubscribe(messageWords) {
		if(messageWords.length < 2) {
			self.sendMessage(constants.ERR_SUBSCRIBE_INVALID);
			return; //Invalid subscribe command
		}
		//Is this a valid game?
		var gameList = require('./sockets.js').gameList;
		var gameIndex = _.findIndex(gameList,{name: messageWords[1]});
		if(gameIndex < 0) {
			//Invalid game
			self.sendMessage(constants.ERR_SUBSCRIBE_INVALID);
			return;
		}
		var targetGame = gameList[gameIndex];
		self.gameName = targetGame.name;
		log.info("Viewer " + self.name + " subscribed to game " + targetGame.name);
		self.sendMessage(constants.SCOMMAND_GAMEUPDATE + " " + targetGame.stringifyBoardState());
	};

  //End the connection with the client, sending an optional message
	self.kill = function kill(message) {
		if(self.killed) {
			return;
		}
		log.info("Kicking viewer <"+self.name+"> with message: " + message);
		if(message) {
			self.sendMessage(message);
		}
		self.killed = true;
		connection.close();
    var viewerList = require('./viewerManager.js').viewerList;
    viewerList.splice(_.findIndex(viewerList,{name: self.name}),1);
	};


};
