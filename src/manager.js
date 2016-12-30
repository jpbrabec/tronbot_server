var log = require('./log.js');
var Game = require('./game.js');
var constants = require('./const.js');
var _ = require('underscore');
var matchMaking = false;

/**
* Match any pending players to start a game
*/
module.exports.runMatchmaking = function runMatchmaking() {
    if(matchMaking) {
      log.debug("Matchmaking is already in progress, adding another queue");
      setTimeout(module.exports.runMatchmaking,0);
      return;
    }
    matchMaking = true;
    var pendingList = [];
    var gameList = require('./sockets.js').gameList;
    var clientList = require('./sockets.js').clientList;
    for(var i = 0; i < clientList.length; i++) {
        if(clientList[i].state === constants.STATE_PENDING) {
            pendingList.push(clientList[i]);
        }
    }
    log.info("\n----------------\nBefore Matchmaking Status: \nConnected Clients:" + getNames(clientList) + "\nGames: "  + gameList.length + " games in progress.\nClients Waiting: " + getNames(pendingList));
    while(pendingList.length >= 2) {
        var newGame = new Game([pendingList[0],pendingList[1]]);
        gameList.push(newGame);
        pendingList.splice(0,2);
        newGame.startGame();
    }
    log.info("After Matchmaking Status: \nConnected Clients:" + getNames(clientList) + "\nGames: "  + gameList.length + " games in progress.\nClients Waiting: " + getNames(pendingList)+"\n----------------------");
    matchMaking = false;
};


/**
* Run every second, refreshing rate limit counters
*/
module.exports.tickHandler = function tickHandler() {
  var clientList = require('./sockets.js').clientList;
    for(var i = 0; i < clientList.length; i++) {
        clientList[i].cycleRequests = 0; //Reset api limit
    }
};

/**
* Run when a game is ending
*/
module.exports.notifyGameOver = function notifyGameOver(gameName) {

  //TODO- Update scores in database

  var gameList = require('./sockets.js').gameList;

  //TODO- run matchmaking periodically or run it after kicking players. Right now players can die and wont be rematched.

  //Update state for each player
  var gameIndex = _.findIndex(gameList,{name: gameName});
  for(var playerName in gameList[gameIndex].playersList) {
    var player = gameList[gameIndex].playersList[playerName];
    if(player) {
      log.debug("Updating player " + playerName);
      player.state = constants.STATE_PENDING;
      player.gameName = null;
      player.sendMessage(constants.PLAYER_WIN); //TODO- Determine which player won
    }
  }

  //Remove game from list
  log.debug("Removing game at index " + gameIndex + " from list");
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

function getNames(list) {
  if(!list) {
    return "[]";
  }
  var ret = "[";
  for(var i=0; i < list.length;i++) {
    ret += list[i].name + ", ";
  }
  ret += "]";
  return ret;
}
