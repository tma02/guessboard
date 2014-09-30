module.exports = function(uuid, socket, username) {
	console.log('Created new user uuid: ' + uuid);
	return {
		uuid: uuid,
		nickname: username,
		points: 0,
		socket: socket,
		roomId: ""
	};
}