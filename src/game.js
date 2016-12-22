/**
 * Game being played between clients
 */
module.exports = function Game(players) {
	var self = this;
	self.playersList = players;
	self.boardState = generateBoard(5);
	self.id = generateID();
	self.turnCount = 0;

    console.log("Starting game <" + self.id + "> with " + self.playersList.length + " players ");

	//Print the board state
	self.printBoard = function printBoard() {
		for(var y=0; y<5; y++) {
			var row = "";
			for(var x=0; x<5; x++) {
				row += self.boardState[x][y] + ", ";
			}
			console.log(row);
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

	self.printBoard();
	self.requestMoves();
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
