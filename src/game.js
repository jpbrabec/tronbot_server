var log = require('./log.js');
var manager = require('./manager.js');
var viewerManager = require('./viewerManager.js');
var constants = require('./const.js');
var _ = require('underscore');
require('dotenv').config();

/**
 * Game being played between clients
 */
module.exports = function Game(players) {
	var self = this;
	self.playersList = {};
	self.currentPlayerCount = players.length;
	self.playerNumbers = {}; //Number on game board for player
	self.movesList = {};
	self.boardSize = process.env.BOARDSIZE;
	self.name = "GAME_" + manager.generateID();
	self.turnCount = 0;
	self.timeoutCancel = null;
	self.ended = false;

	for(var i=0; i < players.length; i++) {
		self.playersList[players[i].name] = players[i];
		self.playersList[players[i].name].gameName = self.name;
		self.playerNumbers[players[i].name] = i+1;
	}

  log.info("Starting game <" + self.name + "> with " + self.currentPlayerCount);

	//Print the board state
	self.printBoard = function printBoard() {
		for(var y=0; y<self.boardSize; y++) {
			var row = "";
			for(var x=0; x<self.boardSize; x++) {
				row += self.boardState[x][y] + ", ";
			}
			log.debug(row);
		}
	};

	//Request moves from clients
	self.requestMoves = function requestMoves() {
		log.debug("Requesting moves for game <" + self.name + ">");
		for(var playerName in self.playersList) {
			var player = self.playersList[playerName];
			player.state = constants.STATE_REQMOVES;
			player.cycleRequests = 0; //Reset ratelimit value
			self.movesList[player.name] = null; //Clear player move
			player.sendMessage(constants.SCOMMAND_REQUEST_MOVE + " " + self.stringifyBoardState());
		}
	};

	//Process moves from clients. Returns false if game ends.
	self.processMoves = function processMoves() {
		log.info("CRUNCHING MOVES FOR TURN #"+self.turnCount);
		log.debug("BOARD STATE BEFORE TURN");
		self.printBoard();
		var oldCoords = {};
		var diff = {};
		var newCoords = {};
		var stillAlive = {};
		var player;
		var playerName;
		//Determine new positions and bound check
		for(playerName in self.playersList) {
			//Determine old & new positions
			player = self.playersList[playerName];
			oldCoords[playerName] = self.getPlayerCoordinates(playerName);
			switch(self.movesList[playerName]) {
				case constants.MOVE_UP:
					diff[playerName] = {x: 0, y: -1};
					break;
				case constants.MOVE_DOWN:
					diff[playerName] = {x: 0, y: 1};
					break;
				case constants.MOVE_RIGHT:
					diff[playerName] = {x: 1, y: 0};
					break;
				case constants.MOVE_LEFT:
					diff[playerName] = {x: -1, y: 0};
					break;
				default:
					diff[playerName] = {x: 0, y: 0};
					break;
			}
			newCoords[playerName] = {x: oldCoords[playerName].x + diff[playerName].x, y: oldCoords[playerName].y + diff[playerName].y};
			log.debug("OLD COORDS " + JSON.stringify(oldCoords[playerName]));
			log.debug("DIFF COORDS " + JSON.stringify(diff[playerName]));
			log.debug("NEW COORDS " + JSON.stringify(newCoords[playerName]));

			//Is this player moving out of bounds?
			if(newCoords[playerName].x < 0 ||
				newCoords[playerName].x >= self.boardSize ||
				newCoords[playerName].y < 0 ||
				newCoords[playerName].y >= self.boardSize) {
					//Player has left the board and should die
					stillAlive[playerName] = false;
				} else {
					stillAlive[playerName] = true;
				}
		}

		//Check for collisions with walls
		for(playerName in self.playersList) {
			player = self.playersList[playerName];

			//Is this player alive? They may have gone out of bounds.
			if(!stillAlive[playerName]) {
				continue; //They're already dead, skip this player
			}
			//Is the new location occupied already?
			var targetState = self.boardState[newCoords[playerName].x][newCoords[playerName].y];
			if(targetState !== 0) {
				log.info("COLLISION with wall for <"+ playerName + "> in game <"+self.name+">");
				//This player hit a wall OR an opponents position before moving
				stillAlive[playerName] = false;
			}
		}

		//Move all the living players and check for collisions
		for(playerName in self.playersList) {
				player = self.playersList[playerName];
				if(stillAlive[playerName]) {
				//Convert previous position to a wall
				self.boardState[oldCoords[playerName].x][oldCoords[playerName].y] *= -1;

				//Is this next square occupied? If so, you both die.
				var updatedState = self.boardState[newCoords[playerName].x][newCoords[playerName].y];
				if(updatedState > 0) {
					//This player and targetState player both die
					stillAlive[playerName] = false;
					//Get the player name assosciated with the cell you collided with
					var otherPlayer = self.getPlayerNameFromNumber(updatedState);
					log.info("COLLISION between bikes for <"+ playerName + "> and <"+otherPlayer+"> in game <"+self.name+">");
					if(otherPlayer) {
						//Kill this player too
						stillAlive[otherPlayer] = false;
					}
				}
				self.boardState[newCoords[playerName].x][newCoords[playerName].y] = self.playerNumbers[playerName]; //TODO- This wont work you need a mapping
			}
		}

		//Handle dead players. Convert all dead bikes into walls. Check for match end.
		for(playerName in self.playersList) {
			player = self.playersList[playerName];
			if(!stillAlive[playerName]) {
				log.warn("PLAYER <" + playerName + "> died!");

				//Convert their bike location to a wall if needed IF the player died in-bounds
				//Was this player in bounds?
				if(!(newCoords[playerName].x < 0 ||
					newCoords[playerName].x >= self.boardSize ||
					newCoords[playerName].y < 0 ||
					newCoords[playerName].y >= self.boardSize)) {
						//Player was in bounds. Swap their position to a wall if not already.
						if(self.boardState[newCoords[playerName].x][newCoords[playerName].y] > 0) {
							self.boardState[newCoords[playerName].x][newCoords[playerName].y] *= -1;
						}
					}
				self.killPlayer(playerName);
			}
		}

		//Is there only 1 or 0 players left?
		if(self.currentPlayerCount <= 1) {
			//Determine who the
			log.warn("Game <"+self.name + "> ended!");
			self.endGame(self.determineWinner());
			return false;
		} else {
			log.info("Game <" + self.name + "> will continue, " + self.currentPlayerCount + " players left.");
		}

		log.info("FINISHED CRUNCHING MOVES FOR TURN #"+self.turnCount);
		viewerManager.notifyViewers(self.name);
		return true;
	};

	//Returns the name of the remaining player, or null
	self.determineWinner = function determineWinner() {
		var pName, winnerName;
		var playerCount = 0;
		for(pName in self.playersList) {
			player = self.playersList[pName];
				//This player should be the winner
				winnerName = pName;
				playerCount += 1;
		}
		if(playerCount !== 1) {
			//There is no current winner
			log.warn("Tried to determine winner for game <" + self.name + "> but there are " + playerCount + " living players.");
			return null;
		} else {
			return winnerName;
		}
	};

	//Get player name from number
	self.getPlayerNameFromNumber = function getPlayerNameFromNumber(pNum) {
		var pName;
		for(pName in self.playersList) {
				//Is the player we're looking for?
				if(pNum === self.playerNumbers[pName]) {
					return pName;
				}
		}
		log.warn("Unable to get player name from number " + pNum + " for game <" + self.name + ">");
		return null;
	};

	//Kills the player. Call when the player dies.
	self.killPlayer = function killPlayer(playerName,optionalMessage) {
		log.info("Player " + playerName + " died.");
		var player = self.playersList[playerName];
		var message = optionalMessage || constants.PLAYER_DIED;

		//Add a loss to the player's tally
		self.playersList[playerName].updateScore(false);

		//Remove player from game
		delete self.playersList[playerName];
		self.currentPlayerCount -= 1;
		player.state = constants.STATE_PENDING;

		//Let player know they died
		player.kill(message);
		player.gameName = null;//Break this AFTER kill() so they can notify

	};

	//Returns the player coordinates of the player
	self.getPlayerCoordinates = function getPlayerCoordinates(playerName) {
		var pNum = self.playerNumbers[playerName];
		//Search the grid for this player
		for(var y=0; y<self.boardSize; y++) {
			for(var x=0; x<self.boardSize; x++) {
				//Does this cell contain the player
				if(self.boardState[x][y] == pNum) {
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

		if(self.ended) {
			log.info("Game <" + self.name + "> already ended. Aborting turn "+ self.turnCount);
			return;
		}

		//Process pending moves
		var result = true;
		if(self.turnCount > 0) {
			result = self.processMoves();
		}
		//Did the game end during the processing?
		if(!result) {
			return;
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

		//For now just end the game with no winner
		//TODO- Dont end the game when this happens, people will quit when their bot dies
		//TODO- The winner should be the other player who did not DC


		//Did we expect this? is the player inside the current player list?
		//If so, we didn't expect it
		if(self.playersList[playerName]) {
			log.info("Game <" + self.name + "> had a player disconnect unexpectedly! " + playerName);
			//This was unexpected. Something funky happened.
			// var winner = self.determineWinner();

			//Find the name of the player who didnt die
			var pName, winner;
			for(pName in self.playersList) {
				player = self.playersList[pName];
					if(pName !== playerName) {
						//This person did NOT disconnect
						winner = pName;
					}
			}
			log.info("Becase <" + playerName + "> disconnected unexpectedly this guy won: " + winner);

			//If only one player is left, the other one wins
			if(winner) {
				self.endGame(winner);
			} else {
				//if there are 2+ players left, nobody wins
				self.endGame();
			}
		} else {
			//This was expected, the player was kicked or died
			//Everything is fine
		}


	};

	//Called when a player makes a move
	self.notifyPlayerMove = function notifyPlayerMove(playerName,move) {
		var player = self.playersList[playerName];
		if(!player) {
			//Player died or DC'ed, ignore their move
			log.info("Ignoring dead player move from " + playerName);
			return;
		}

		//Update player state
		self.playersList[playerName].state = constants.STATE_SENTMOVES;
		self.movesList[playerName] = move;

		//Have all players sent moves?
		var ready = 0;
		for(var pName in self.playersList) {
			if(self.movesList[pName]) {
				ready += 1;
			}
		}
		if(ready < self.currentPlayerCount) {
			log.info("Game <" + self.name + "> still waiting on moves. Have " + ready + "/" + self.currentPlayerCount);
		} else {
			//We can start the next turn as soon as we want
			log.info("Game <" + self.name + "> now has " + ready + "/" + self.currentPlayerCount + " moves.");

			//Reset the timeout with a short delay so the game doesn't go too fast
			if(self.timeoutCancel) {
				clearTimeout(self.timeoutCancel);
				self.timeoutCancel = null;
			}
			self.timeoutCancel = setTimeout(self.turnTimeout,process.env.DEFAULT_DELAY || 500);
			// self.runTurn();
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
		switch(self.currentPlayerCount) {
			case 2:
				var mid = Math.floor(self.boardSize/2);
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

	self.endGame = function endGame(winningPlayerName) {
		//Cancel previous timeout if set
		if(self.timeoutCancel) {
			clearTimeout(self.timeoutCancel);
			self.timeoutCancel = null;
		}

		if(self.ended) {
			return; //Already ended game
		}
		self.ended = true;

		manager.notifyGameOver(self.name,winningPlayerName);
	};

	self.turnTimeout = function turnTimeout() {
		log.info("Game <" + self.name + "> timeout expired.");
		if(self.ended) {
			return;
		}
		log.info("Game <" + self.name + "> timeout TRIGGERED.");
		//TODO- Handle timeout
		//TODO- Also make sure all the clients are still alive, ending game otherwise.

		//Have all players sent moves?
		var ready = 0;
		for(var pName in self.playersList) {
			if(self.movesList[pName]) {
				ready += 1;
			} else {
				//This player is late. Kill them.
				log.info("Player " + pName + " took too long to respond and has been kicked.");
				self.killPlayer(pName,constants.ERR_TIMEOUT);
			}
		}

		//Run a turn. If any clients send a move after being killed, it will be dropped.
		self.runTurn();
	};

	//Send message to each player with game info
	self.notifyPlayersGameStart = function notifyPlayersGameStart() {
		log.debug("Notifying players of game start for game <" + self.name + ">");
		for(var playerName in self.playersList) {
			var player = self.playersList[playerName];
			player.sendMessage(constants.GAME_START + " " + self.playerNumbers[playerName] + " " + self.currentPlayerCount);
		}
	};

	self.startGame = function startGame() {
		self.generateBoard(self.boardSize);
		self.notifyPlayersGameStart();
		self.runTurn();
	};
};
