var clientList = require('./sockets.js').clientList;
var gameList = require('./sockets.js').gameList;
var log = require('./log.js');
var Game = require('./game.js');
var constants = require('./const.js');
var _ = require('underscore');

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
        var newGame = new Game([pendingList[0],pendingList[1]]);
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

/**
* Run when a game is ending
*/
module.exports.notifyGameOver = function notifyGameOver(gameName,winner) {

  if(winner == -1) {
    log.warn("Game " + gameName + " ended unexpectedly.");
  } else {
    //TODO- Update scores in database
  }

  //Update state for each player
  var gameIndex = _.findIndex(gameList,{name: gameName});
  for(var i=0; i<gameList[gameIndex].playersList; i++) {
    gameList[gameIndex].playersList[i].state = constants.STATE_PENDING;
  }

  //Remove game from list
  log.info("Removing game at index " + gameIndex + " from list");
  gameList.splice(gameIndex,1);

  //Run matchmaker again
  module.exports.runMatchmaking();
};

//Generate a unique id
module.exports.generateID = function generateID() {
	var prefix = "";
	for(var i=0;i<5;i++) {
		prefix += String.fromCharCode(65 + Math.floor(Math.random() * 26));
	}
	return prefix + Date.now();
};
