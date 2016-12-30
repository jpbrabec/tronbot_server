var log = require('./log.js');
var constants = require('./const.js');
var Viewer = require('./viewer.js');
var viewersList = [];
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
      log.info(' Peer ' + connection.remoteAddress + ' disconnected.');
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
module.exports.notifyViewers = function notifyViewers(gameID) {
  //TODO- Have games call this function when they update their state
  //TODO- This function will then notify all subscribed viewers of the change
  //TODO- This file will keep its own ViewerList[] array, and each viewer will have a list of subscribed games
};

module.exports.viewersList = viewersList;

//COMMAND NumOfGames Game1, Game2, Game3, Game4
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
      message += "" + gameList[i].name + "";
    } else {
      message += "" + gameList[i].name + ", ";
    }
  }
  return message;
}
