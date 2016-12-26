var log = require('./log.js');

/**
* Handler for game viewers. Viewers may not participate in games but can subscribe to game data.
*/
module.exports.handler = function viewerHandler(request) {

  var connection = request.accept('tron-protocol', request.origin);
  log.info("Viewer Connection accepted.");

  //Message Received
  connection.on('message', function(message) {
      if (message.type === 'utf8') {
          console.log('Received Message: ' + message.utf8Data);
          connection.sendUTF("Hello Viewer");
      } else if (message.type === 'binary') {
          console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
          connection.sendBytes(message.binaryData);
      }
  });

  //Connection closed
  connection.on('close', function(reasonCode, description) {
      log.info(' Peer ' + connection.remoteAddress + ' disconnected.');
  });
};


module.exports.notifyViewers = function notifyViewers(gameID) {
  //TODO- Have games call this function when they update their state
  //TODO- This function will then notify all subscribed viewers of the change
  //TODO- This file will keep its own ViewerList[] array, and each viewer will have a list of subscribed games
};
