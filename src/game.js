var log = require('./log.js');
require('dotenv').config();

/**
 * Game being played between clients
 */
module.exports = function Game(players) {
	var self = this;
	self.playersList = players;
	self.boardState = generateBoard(5);
	self.name = generateID();
	self.turnCount = 0;
	self.timeoutCancel = null;

    log.info("Starting game <" + self.name + "> with " + self.playersList.length + " players: " + players);

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
			players[i].status = "REQUESTED_MOVE";
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
		requestMoves();

		//Start a timout for slow clients
		self.timeoutCancel = setTimeout(self.turnTimeout,process.env.MOVETIMEOUT || 1500);
	};

	self.turnTimeout = function turnTimeout() {
		log.info("Game <" + self.name + "> timeout expired.");
		//TODO- Handle timeout
		throw "TODO- Handle game timeout";
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

//Generate a unique id
function generateID() {
	var prefix = "";
	for(var i=0;i<5;i++) {
		prefix += String.fromCharCode(65 + Math.floor(Math.random() * 26));
	}
	return prefix + Date.now();
}
