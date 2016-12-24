var clientList = require('./sockets.js').clientList;
var gameList = require('./sockets.js').gameList;
var log = require('./log.js');
var Game = require('./game.js');
var tickNumber = 0;
var constants = require('./const.js');

/**
* Logic to update all games in progress
*/
module.exports = function updateTick() {
    tickNumber += 1;
    log.debug("Server Tick <" + tickNumber + ">. \n" + clientList.length + " clients connected\n" + gameList.length + " games in progress.");
    updateClients();
    pairPlayers();
};


/**
* Match any pending clients to start new games
*/
function pairPlayers() {
    var pendingList = [];
    for(var i = 0; i < clientList.length; i++) {
        if(clientList[i].state === constants.STATE_PENDING) {
            pendingList.push(clientList[i]);
        }
    }
    log.debug("There are " + pendingList.length + " clients waiting for games.");
    while(pendingList.length >= 2) {
        var newGame = Game([pendingList[0],pendingList[1]]);
        gameList.push(newGame);
        pendingList.splice(0,2);
    }
}

/**
* Process all moves in games, then request new moves
*/
function updateGames() {
    for(var i = 0; i < gameList.length; i++) {
        if(gameList[i].turnCount > 0) {
            gameList[i].processMoves();
            gameList[i].requestMoves();
        }
    }
}

/**
* Update logic for all connected clients
*/
function updateClients() {
    for(var i = 0; i < clientList.length; i++) {
        clientList[i].cycleRequests = 0; //Reset api limit
    }
}
