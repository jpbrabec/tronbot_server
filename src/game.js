var log = require('./log.js');
var manager = require('./manager.js');
var constants = require('./const.js');
require('dotenv').config();

/**
 * Game being played between clients
 */
module.exports = function Game(players) {
	var self = this;
	self.playersList = players;
	self.boardState = generateBoard(5);
	self.name = "GAME_" + manager.generateID();
	self.turnCount = 0;
	self.timeoutCancel = null;
	self.ended = false;

  log.info("Starting game <" + self.name + "> with " + self.playersList.length);

	//Print the board state
	self.printBoard = function printBoard() {
		for(var y=0; y<5; y++) {
			var row = "";
			for(var x=0; x<5; x++) {
				row += self.boardState[x][y] + ", ";
			}
			log.debug(row);
		}
	};

	//Request moves from clients
	self.requestMoves = function requestMoves() {
		for(var i=0; i<self.playersList.length; i++) {
			players[i].state = constants.STATE_REQMOVES;
			players[i].sendMessage("Please send us your move, thanks.");
			//TODO- Each client should have a move json object where they keys are gameIDs and the values are moves.
		}
	};

	//Process moves from clients
	self.processMoves= function processMoves() {
		//TODO- Check if any clients did not move
	};

	self.runTurn = function runTurn() {
		//Cancel previous timeout if set
		if(self.timeoutCancel) {
			clearTimeout(self.timeoutCancel);
			self.timeoutCancel = null;
		}

		//Process pending moves
		if(self.turnCount > 0) {
			processMoves();
		}

		//Request new moves
		self.requestMoves();

		//Start a timout for slow clients
		self.timeoutCancel = setTimeout(self.turnTimeout,process.env.MOVETIMEOUT || 1500);
	};

	//Called when a player leaves the game for any reason
	self.notifyPlayerLeft = function notifyPlayerLeft(playerName) {
		log.info("Game <" + self.name + "> had a player disconnect early! " + playerName);

		//For now just end the game with no winner
		//TODO- The winner should be the other player who did not DC
		self.endGame(-1);
	};

	self.endGame = function endGame(winner) {
		if(self.ended) {
			return; //Already ended game
		}
		self.ended = true;
		//Cancel previous timeout if set
		if(self.timeoutCancel) {
			clearTimeout(self.timeoutCancel);
			self.timeoutCancel = null;
		}
		manager.notifyGameOver(self.name,winner);
	};

	self.turnTimeout = function turnTimeout() {
		log.info("Game <" + self.name + "> timeout expired.");
		//TODO- Handle timeout
		log.error("FIXME- Handle game timeout");
	};

	self.runTurn();
};

function generateBoard(size) {
	var arr = [];
	for (var i=0;i<size;i++) {
		arr[i] = [];
		for(var j=0;j<size;j++) {
			arr[i][j] = 0;
		}
	}
	return arr;
}
