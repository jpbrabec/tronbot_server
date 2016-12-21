/**
 * Client connected to the server
 */
module.exports = function Client(socket) {
	var self = this;
	self.socket = socket;
	self.name = socket.remoteAddress+":"+socket.remotePort;
	self.status = "STATUS_PENDING";
	
	//Write data to the client
	this.sendMessage = function(message) {
		console.log("Sending message to socket <"+self.name+">");
		socket.write(message+"\n");
	}

	//End the connection with the client
	this.kill = function() {
		console.log("Kicking client <"+self.name+">");
		socket.destroy();
	}
}
