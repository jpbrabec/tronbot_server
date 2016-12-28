var log = require('./log.js');
var manager = require('./manager.js');
var constants = require('./const.js');
var _ = require('underscore');
require('dotenv').config();

/**
 * Game being played between clients
 */
module.exports = function Game(players) {
	var self = this;
	self.playersList = players;
	self.movesList = [];
	self.boardSize = process.env.BOARDSIZE;
	self.name = "GAME_" + manager.generateID();
	self.turnCount = 0;
	self.timeoutCancel = null;
	self.ended = false;

	for(var i=0; i < self.playersList.length; i++) {
		self.playersList[i].gameName = self.name;
	}

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
		log.debug("Requesting moves for game <" + self.name + ">");
		for(var i=0; i<self.playersList.length; i++) {
			self.playersList[i].state = constants.STATE_REQMOVES;
			self.movesList[i] = null;
			self.playersList[i].sendMessage(constants.SCOMMAND_REQUEST_MOVE + " " + self.stringifyBoardState());
		}
	};

	//Process moves from clients
	self.processMoves= function processMoves() {
		//TODO- Update board state
	};

	//Starts a turn, requesting moves and setting timeout
	self.runTurn = function runTurn() {
		log.info("Game <" + self.name + "> starting turn "+ self.turnCount);
		//Cancel previous timeout if set
		if(self.timeoutCancel) {
			clearTimeout(self.timeoutCancel);
			self.timeoutCancel = null;
		}

		//Process pending moves
		if(self.turnCount > 0) {
			self.processMoves();
		}
		//Request new moves
		self.requestMoves();
		//Start a timout for slow clients
		self.timeoutCancel = setTimeout(self.turnTimeout,process.env.MOVETIMEOUT || 1500);
		//Increase counter
		self.turnCount += 1;
	};

	//Called when a player leaves the game for any reason
	self.notifyPlayerLeft = function notifyPlayerLeft(playerName) {
		log.info("Game <" + self.name + "> had a player disconnect early! " + playerName);

		//For now just end the game with no winner
		//TODO- The winner should be the other player who did not DC
		self.endGame(-1);
	};

	//Called when a player makes a move
	self.notifyPlayerMove = function notifyPlayerMove(playerName,move) {
		var playerIndex = _.findIndex(self.playersList,{name: playerName});
		//Update player state
		self.playersList[playerIndex].state = constants.STATE_SENTMOVES;
		self.movesList[playerIndex] = move;

		//Have all players sent moves?
		var ready = 0;
		for(var i=0; i < self.playersList.length; i++) {
			if(self.movesList[i] !== null) {
				ready += 1;
			}
		}
		if(ready < self.playersList.length) {
			log.info("Game <" + self.name + "> still waiting on moves. Have " + ready + "/" + self.playersList.length);
		} else {
			//We can start the next turn immediately
			log.info("Game <" + self.name + "> now has " + ready + "/" + self.playersList.length + " moves. Running turn.");
			self.runTurn();
		}
	};

	//Returns board state as a string
	self.stringifyBoardState = function stringifyBoardState() {
		var message = "";
		message += self.boardSize + " ";
		for(var y=0; y<self.boardSize; y++) {
			var row = "";
			for(var x=0; x<self.boardSize; x++) {
				row += self.boardState[x][y];
				if(y != self.boardSize-1 || x != self.boardSize-1) {
					 row += ",";
				}
			}
			message += row;
		}
		return message;
	};
	self.generateBoard = function generateBoard() {
		var arr = [];
		for (var i=0;i<self.boardSize;i++) {
			arr[i] = [];
			for(var j=0;j<self.boardSize;j++) {
				arr[i][j] = 0;
			}
		}
		switch(self.playersList.length) {
			case 2:
				var mid = self.boardSize/2;
				arr[0][mid] = 1;
				arr[self.boardSize-1][mid] = 1;
				break;
			default:
				throw "Unknown initial board state! Too many players!";
		}

		self.boardState = arr;
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
		//TODO- Also make sure all the clients are still alive, ending game otherwise.
		log.error("FIXME- Handle game timeout");
	};

	self.startGame = function startGame() {
		self.generateBoard(self.boardSize);
		self.runTurn();
	};
};
