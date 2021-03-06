var log = require('./log.js');
var Game = require('./game.js');
var constants = require('./const.js');
var viewerManager = require('./viewerManager.js');
var _ = require('underscore');
var matchMaking = false;

//Runs matchmaking when available
module.exports.runMatchmaking = function runMatchmaking() {
    setTimeout(module.exports.executeMatchmaking,0);
};

/**
* Match any pending players to start a game
*/
module.exports.executeMatchmaking = function executeMatchmaking() {
    if(matchMaking) {
      log.debug("Matchmaking is already in progress, adding another queue");
      setTimeout(module.exports.executeMatchmaking,0);
      return;
    }
    matchMaking = true;
    var pendingList = [];
    var gameList = require('./sockets.js').gameList;
    var clientList = require('./sockets.js').clientList;
    var newGames = 0;
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
        newGames += 1;
    }
    if(newGames > 0) {
      viewerManager.updateGamesList();
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
module.exports.notifyGameOver = function notifyGameOver(gameName,winningPlayerName) {

  var gameList = require('./sockets.js').gameList;

  //Update state for each player
  var gameIndex = _.findIndex(gameList,{name: gameName});
  for(var playerName in gameList[gameIndex].playersList) {
    var player = gameList[gameIndex].playersList[playerName];
    if(player) {
      log.debug("Updating player " + playerName);
      player.state = constants.STATE_PENDING;
      player.gameName = null;
      if(!!winningPlayerName && playerName === winningPlayerName) {
        //Add a win to the player's tally
        player.updateScore(true);
        player.kill(constants.PLAYER_WIN);
      } else {
        //Add a loss to the player's tally
        player.updateScore(false);
        player.kill(constants.PLAYER_DIED);
      }
    }
  }

  //Remove game from list
  log.debug("Removing game at index " + gameIndex + " from list");
  gameList.splice(gameIndex,1);

  //Notify viewers of new game list
  viewerManager.updateGamesList();

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
