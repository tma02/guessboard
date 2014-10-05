module.exports = function(socket, username, password) {
	console.log('Created new user id: ' + socket.id);
	return {
		id: socket.id,
		username: username,
		password: password,
		points: 0,
		socket: socket,
		roomId: ""
	};
}