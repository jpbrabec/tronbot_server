var manager = require('./manager.js');
var log = require('./log.js');

/**
 * Viewer connected to the server
 */
module.exports = function Viewer(connection) {
	var self = this;
	self.connection = connection;
	self.name = manager.generateID();
	self.killed = false;
  log.info("Viewer Connected: " + self.name);

	//Write data to the client
	self.sendMessage = function sendMessage(message) {
		if(self.killed) {
			return;
		}
    self.connection.sendUTF(message + ";");
	};

  //Handle an incoming message
  self.receiveMessage = function receiveMessage(message) {
    log.warn(self.name + ": Got message: " + message);
  };

  //End the connection with the client, sending an optional message
	self.kill = function kill(message) {
		if(self.killed) {
			return;
		}
		log.info("Kicking viewer <"+self.name+"> with message: " + message);
		if(message) {
			self.sendMessage(message);
		}
		self.killed = true;
		connection.close();
    var viewerList = require('./viewerManager.js').viewerList;
    viewerList.splice(_.findIndex(viewerList,{name: self.name}),1);
	};


};
