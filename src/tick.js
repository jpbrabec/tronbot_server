var clientList = require('./sockets.js').clientList;
var gameList = require('./sockets.js').gameList;

/**
* Logic to update all games in progress
*/
module.exports = function updateTick() {
    console.log("Server Tick. " + clientList.length + " clients connected, " + gameList.length + " games in progress.");
}
