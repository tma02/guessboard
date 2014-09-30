module.exports = {
	versionOkay: function(socket) {
		socket.on('joinRoom', function(data) {
			socket.join(data.roomId);
			
			joinedRoom(socket);
		});
	},
	joinedRoom: function(socket) {

	}
}