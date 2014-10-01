module.exports = function(socket, username) {
	console.log('Created new user id: ' + socket.id);
	return {
		id: socket.id,
		username: username,
		points: 0,
		socket: socket,
		roomId: ""
	};
}