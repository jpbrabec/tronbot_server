var log = require('./log.js');
var constants = require('./const.js');
var Viewer = require('./viewer.js');
var viewersList = [];
var _ = require('underscore');


/**
* Handler for game viewers. Viewers may not participate in games but can subscribe to game data.
*/
module.exports.handler = function viewerHandler(request) {

  var connection = request.accept('tron-protocol', request.origin);

  var newViewer = new Viewer(connection);
  viewersList.push(newViewer);
  newViewer.sendMessage(buildGameListMessage());

  //Message Received
  connection.on('message', function(message) {
      if (message.type === 'utf8') {
          log.debug('Received Message: ' + message.utf8Data);
          newViewer.receiveMessage(message.utf8Data);
      } else if (message.type === 'binary') {
          log.warn('Received Binary Message of ' + message.binaryData.length + ' bytes. Not accepted.');
      }
  });

  //Connection closed
  connection.on('close', function(reasonCode, description) {
      log.info(' Viewer '  + newViewer.name +  ' at '  + connection.remoteAddress + ' disconnected.');
  });
};

//Push all viewers an update about the game list
module.exports.updateGamesList = function updateGamesList() {
  //Send each client an update games list
  for(var i=0; i <viewersList.length; i++) {
    viewersList[i].sendMessage(buildGameListMessage());
  }
};

//Push updated game state to subscribed viewers
module.exports.notifyViewers = function notifyViewers(gameName) {
  //TODO- Have games call this function when they update their state
  //TODO- This function will then notify all subscribed viewers of the change
  //TODO- This file will keep its own viewerList[] array, and each viewer will have a list of subscribed games
  //TODO- When a game ends kill all the viewers. OR break the link here if lookup fails.
  log.info("Notifying viewers for game " + gameName);
  for(var i=0; i < viewersList.length; i++) {
    try {
      //Is this viewer subscribed to this game?
      var viewer = viewersList[i];
      if(!viewer.gameName || viewer.gameName !== gameName) {
        continue; //Not subscribed
      } else {
        var gameList = require('./sockets.js').gameList;
        var gameIndex = _.findIndex(gameList,{name: viewer.gameName});
        if(gameIndex < 0) {
          //Invalid game index
          viewer.gameName = null;
        } else {
          viewer.sendMessage(constants.SCOMMAND_GAMEUPDATE + " " + gameList[gameIndex].stringifyBoardState());
        }
      }
    } catch(e) {
      log.error("Error sending message to viewer in game " + gameName + ": " + e + "\n" + e.stack);
    }
  }

};

module.exports.viewersList = viewersList;

//COMMAND NumOfGames Game1,Game1Name,Game2,Game2Name,Game3,Game3Name
function buildGameListMessage() {
  var gameList = require('./sockets.js').gameList;
  var message = constants.SCOMMAND_GAMELIST + " ";
  if (gameList.length > 0) {
    message += gameList.length + " ";
  } else {
    message += gameList.length;
  }
  for(var i=0; i < gameList.length; i++) {
    if(i == gameList.length-1) {
      message += "" + gameList[i].name + ",";
      message += "" + getFriendlyGameName(gameList[i]) + "";
    } else {
      message += "" + gameList[i].name + ",";
      message += "" + getFriendlyGameName(gameList[i]) + ",";
    }
  }
  return message;
}

function getFriendlyGameName(game) {
  var gameName = "";
  var i = 0;
  for(var pName in game.playersList) {
    if(i === 0) {
      gameName += game.playersList[pName].friendlyName;
    } else if (i == 1) {
      gameName += "_VS_" + game.playersList[pName].friendlyName;
      break;
    }
    i++;
  }
  return gameName;

}
