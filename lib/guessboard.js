var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var uuid = require('uuid');

var version = '1';
var port = process.env.PORT || 3000;
var rooms = {};
var words = require('./words.json');
console.log('Loaded ' + words.length + ' words.');

require('./routes')(app, uuid);
server.listen(port);
console.log('Listening on port ' + port + '.');

io.on('connection', function (socket) {
	socket.emit('version', {success: false});
	socket.on('version', function(data) {
		if (data.version === version) {
			if (data.username === '') {
				return;
			}
			socket.emit('version', {success: true});
			versionOkay(socket, require('./user')(socket, data.username, data.password));
		}
		else {
			socket.emit('version', {success: false});
		}
	});
});

function versionOkay(socket, user) {
	socket.emit('userId', user.id);
	socket.on('joinRoom', function(data) {
		if (data.roomId == null) {
			data.roomId = uuid.v4();
		}
		socket.join(data.roomId);
		if (rooms[data.roomId] == null) {
			rooms[data.roomId] = require('./room')(data.roomId, user);
			rooms[data.roomId].startTimer(newDrawerAndWord, io, rooms);
		}
		if (!usernameOkay(user.username, data.roomId)) {
			socket.emit('dcerror', {title: 'Error', message: 'Your username is not allowed in this room.'});
			socket.disconnect();
			return;
		}
		if (rooms[data.roomId].password.length != 0) {
			if (user.password != rooms[data.roomId].password) {
				socket.emit('dcerror', {title: 'Error', message: 'The password is incorrect.'});
				socket.disconnect();
				return;
			}
		}
		if (rooms[data.roomId].users.length == 0) {
			rooms[data.roomId].password = user.password;
		}
		rooms[data.roomId].users.push(user);
		user.roomId = data.roomId;
		var userList = '';
		for (var i = 0; i < rooms[data.roomId].users.length; i++) {
			userList += (i == 0 ? '' : ', ') + rooms[data.roomId].users[i].username;
		}
		socket.emit('joinedRoom', {roomId: data.roomId, userList: userList});
		joinedRoom(socket, user);
		socket.on('disconnect', function() {
			io.to(user.roomId).emit('chat', {user: 'sys', message: user.username + ' has left the room.'});
			if (user.id === rooms[user.roomId].getDrawer().id && rooms[data.roomId].users.length >= 2) {
				//drawer just left the room, gg
				console.log('Drawer left room');
				rooms[data.roomId].users.splice(rooms[data.roomId].users.indexOf(user), 1);
				newDrawerAndWord(user.roomId);
			}
			else {
				if (rooms[user.roomId].users.indexOf(user) < rooms[user.roomId].drawerIndex) {
					rooms[user.roomId].drawerIndex--;
				}
				rooms[data.roomId].users.splice(rooms[data.roomId].users.indexOf(user), 1);
			}
			if (rooms[data.roomId].users.length == 0) {
				rooms[data.roomId] = null;
				console.log('Destroyed room id: ' + data.roomId);
			}
			else if (rooms[data.roomId].users.length == 1) {
				clearDrawer(user.roomId);
				io.to(user.roomId).emit('chat', {user: 'sys', message: 'Waiting for more players...'});
			}
			updateUserlist(user.roomId);
			console.log('Abandoned user id: ' + user.id);
		});
	});
}

function joinedRoom(socket, user) {
	updateUserlist(user.roomId);
	io.to(user.roomId).emit('chat', {user: 'sys', message: user.username + ' has joined the room.'});
	io.to(user.roomId).emit('timerUpdate', {timeLeft: rooms[user.roomId].timer, maxTime: rooms[user.roomId].maxTime});
	if (rooms[user.roomId].users.length == 2) {
		newDrawerAndWord(user.roomId);
	}
	else if (rooms[user.roomId].users.length < 2) {
		clearDrawer(user.roomId);
		io.to(user.roomId).emit('chat', {user: 'sys', message: 'Waiting for more players...'});
	}
	socket.on('setUsername', function(data) {
		io.to(user.roomId).emit('chat', {user: 'sys', message: user.username + ' has changed their username to ' + data.username + '.'});
		user.username = data.username;
		io.to(user.roomId).emit('updateUsername', {userId: user.id, username: user.username});
	});
	socket.on('draw', function(data) {
		if (rooms[user.roomId].getDrawer().id === user.id) {
			io.to(user.roomId).emit('draw', {
				userId: user.id,
				x: data.x,
				y: data.y,
				lastX: data.lastX,
				lastY: data.lastY,
				color: data.color
			});
		}
	});
	socket.on('chat', function(data) {
		if (data.message === '') {
			return;
		}
		if (data.message.toLowerCase() === rooms[user.roomId].word && user.id !== rooms[user.roomId].getDrawer().id) {
			//bird is the word
			io.to(user.roomId).emit('chat', {user: 'sys', message: user.username + ' got the word!'});
			io.to(user.roomId).emit('chat', {user: 'sys', message: 'The word was "' + rooms[user.roomId].word + '".'});
			user.points++;
			newDrawerAndWord(user.roomId);
		}
		else {
			io.to(user.roomId).emit('chat', {
				user: user.username,
				message: data.message
			});
		}
	});
}

function updateUserlist(roomId) {
	var userList = '';
	if (rooms[roomId] == null) {
		return;
	}
	for (var i = 0; i < rooms[roomId].users.length; i++) {
		userList += (i == 0 ? '' : ', ') + (i == rooms[roomId].drawerIndex ? '[D]' : '') + rooms[roomId].users[i].username + ': ' + rooms[roomId].users[i].points;
	}
	io.to(roomId).emit('updateUserList', {userList: userList});
}

function newDrawerAndWord(roomId) {
	rooms[roomId].newWord(words);
	rooms[roomId].newDrawer();
	io.to(roomId).emit('updateDrawer', {drawerId: rooms[roomId].getDrawer().id});
	io.to(roomId).emit('chat', {user: 'sys', message: rooms[roomId].getDrawer().username + ' is now drawing!'});
	rooms[roomId].getDrawer().socket.emit('chat', {user: 'sys', message: 'Your word is "' + rooms[roomId].word + '".'});
	io.to(roomId).emit('timerUpdate', {timeLeft: rooms[roomId].timer, maxTime: rooms[roomId].maxTime});
	updateUserlist(roomId);
}

function clearDrawer(roomId) {
	rooms[roomId].newWord(words);
	rooms[roomId].drawerIndex = -1;
	io.to(roomId).emit('updateDrawer', {drawerId: ''});
	io.to(roomId).emit('chat', {user: 'sys', message: 'No one is drawing!'});
	io.to(roomId).emit('timerUpdate', {timeLeft: rooms[roomId].timer, maxTime: rooms[roomId].maxTime});
}

function usernameOkay(username, roomId) {
	var badNames = [];
	var room = rooms[roomId];
	badNames[0] = 'sys';
	var it;
	for (var i = 0; i < room.users.length; i++) {
		it = room.users[i].username.toLowerCase();
		badNames.push(it); //to the limit
	}
	return (badNames.indexOf(username.toLowerCase()) == -1);
}
