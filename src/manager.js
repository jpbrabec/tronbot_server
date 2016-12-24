var clientList = require('./sockets.js').clientList;
var gameList = require('./sockets.js').gameList;
var log = require('./log.js');
var Game = require('./game.js');
var constants = require('./const.js');

/**
* Match any pending players to start a game
*/
module.exports.runMatchmaking = function runMatchmaking() {
    var pendingList = [];
    for(var i = 0; i < clientList.length; i++) {
        if(clientList[i].state === constants.STATE_PENDING) {
            pendingList.push(clientList[i]);
        }
    }
    log.info("Before Matchmaking Status: " + clientList.length + " clients connected. " + gameList.length + " games in progress. " + pendingList.length + " clients waiting for games.");
    while(pendingList.length >= 2) {
        var newGame = Game([pendingList[0],pendingList[1]]);
        gameList.push(newGame);
        pendingList.splice(0,2);
    }
    log.info("After Matchmaking Status: " + clientList.length + " clients connected. " + gameList.length + " games in progress. " + pendingList.length + " clients waiting for games.");
};


/**
* Run every second, refreshing rate limit counters
*/
module.exports.tickHandler = function tickHandler() {
    for(var i = 0; i < clientList.length; i++) {
        clientList[i].cycleRequests = 0; //Reset api limit
    }
};
