/**
 * Game being played between clients
 */
module.exports = function Game(players) {
	var self = this;
	self.playersList = players;
    console.log("Starting game with " + players.length + " players ");
}
