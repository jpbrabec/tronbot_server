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
	self.movesList = {};
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
		for(var y=0; y<self.boardSize; y++) {
			var row = "";
			for(var x=0; x<self.boardSize; x++) {
				row += self.boardState[x][y] + ", ";
			}
			log.info(row);
		}
	};

	//Request moves from clients
	self.requestMoves = function requestMoves() {
		log.debug("Requesting moves for game <" + self.name + ">");
		for(var i=0; i<self.playersList.length; i++) {
			self.playersList[i].state = constants.STATE_REQMOVES;
			self.movesList[self.playersList[i].name] = null; //Clear player move
			self.playersList[i].sendMessage(constants.SCOMMAND_REQUEST_MOVE + " " + self.stringifyBoardState());
		}
	};

	//Process moves from clients
	self.processMoves = function processMoves() {
		log.info("CRUNCHING MOVES FOR TURN #"+self.turnCount);
		log.info("BOARD STATE BEFORE TURN");
		self.printBoard();
		var oldCoords = [];
		var diff = [];
		var newCoords = [];
		var stillAlive = [];

		//Determine new positions and bound check
		for(var playerIndex=0; playerIndex < self.playersList.length; playerIndex++) {
			//Determine old & new positions
			oldCoords[playerIndex] = self.getPlayerCoordinates(playerIndex);
			switch(self.movesList[self.playersList[playerIndex].name]) {
				case constants.MOVE_UP:
					diff[playerIndex] = {x: 0, y: -1};
					break;
				case constants.MOVE_DOWN:
					diff[playerIndex] = {x: 0, y: 1};
					break;
				case constants.MOVE_RIGHT:
					diff[playerIndex] = {x: 1, y: 0};
					break;
				case constants.MOVE_LEFT:
					diff[playerIndex] = {x: -1, y: 0};
					break;
				default:
					diff[playerIndex] = {x: 0, y: 0};
					break;
			}
			newCoords[playerIndex] = {x: oldCoords[playerIndex].x + diff[playerIndex].x, y: oldCoords[playerIndex].y + diff[playerIndex].y};
			log.debug("OLD COORDS " + JSON.stringify(oldCoords[playerIndex]));
			log.debug("DIFF COORDS " + JSON.stringify(diff[playerIndex]));
			log.debug("NEW COORDS " + JSON.stringify(newCoords[playerIndex]));

			//Is this player moving out of bounds?
			if(newCoords.x < 0 ||
				newCoords.x >= self.boardSize ||
				newCoords.y < 0 ||
				newCoords.y >= self.boardSize) {
					//Player has left the board and should die
					stillAlive[playerIndex] = false;
				} else {
					stillAlive[playerIndex] = true;
				}
		}

		//Check for collisions with walls
		for(playerIndex=0; playerIndex < self.playersList.length; playerIndex++) {
			//Is the new location occupied already?
			var targetState = self.boardState[newCoords[playerIndex].x][newCoords[playerIndex].y];
			if(targetState !== 0) {
				//This player hit a wall OR an opponents position before moving
				stillAlive[playerIndex] = false;
			}
		}

		//Move all the living players and check for collisions
		for(playerIndex=0; playerIndex < self.playersList.length; playerIndex++) {
			if(stillAlive[playerIndex]) {
				//Convert previous position to a wall
				self.boardState[oldCoords[playerIndex].x][oldCoords[playerIndex].y] *= -1;

				//Is this next square occupied? If so, you both die.
				var updatedState = self.boardState[newCoords[playerIndex].x][newCoords[playerIndex].y];
				if(updatedState !== 0) {
					//This player and targetState player both die
					stillAlive[playerIndex] = false;
					stillAlive[updatedState*(-1)] = false;
				}
				self.boardState[newCoords[playerIndex].x][newCoords[playerIndex].y] = playerIndex+1;
			}
		}

		//TODO- Handle this
		//Handle dead players. Convert all dead bikes into walls. Check for match end.
		for(playerIndex=0; playerIndex < self.playersList.length; playerIndex++) {
			if(!stillAlive[playerIndex]) {
				log.warn("PLAYER <" + self.playersList[playerIndex].name + "> died!");
			}
		}
		log.info("FINISHED CRUNCHING MOVES FOR TURN #"+self.turnCount);

	};

	self.killPlayer = function killPlayer(playerIndex) {
		//TODO- Update their position on the grid to a negative
		log.error("TODO- Player index " + playerIndex + " died.");
	};

	//Returns the player coordinates of the player
	self.getPlayerCoordinates = function getPlayerCoordinates(playerIndex) {

		//Search the grid for this player
		for(var y=0; y<self.boardSize; y++) {
			for(var x=0; x<self.boardSize; x++) {
				//Does this cell contain the player
				if(self.boardState[x][y] == playerIndex+1) {
					//Return player coordinates
					 return {x: x, y: y};
				}
			}
		}
		log.error("Unable to locate player in game < " +self.gameName + "!");
		return null;
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
		self.movesList[self.playersList[playerIndex].name] = move;

		//Have all players sent moves?
		var ready = 0;
		for(var i=0; i < self.playersList.length; i++) {
			if(self.movesList[self.playersList[i].name]) {
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
				arr[self.boardSize-1][mid] = 2;
				break;
			default:
				throw "Unknown initial board state! Too many players!";
		}

		self.boardState = arr;
		log.info("BOARD IS GENERATED");
		self.printBoard();
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
