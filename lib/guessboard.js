var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var uuid = require('uuid');

var version = '1';
var port = 80;
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
			socket.emit('version', {success: true});
			versionOkay(socket, require('./user')(socket, 'test'));
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
		}
		else if (rooms[data.roomId].password.length != 0) {
			socket.emit('password');
			socket.on('password', function(data) {
				if (data.password === rooms[data.roomId].password) {
					rooms[data.roomId].users.push(user);
					user.roomId = data.roomId;
					socket.emit('joinedRoom', {roomId: data.roomId});
					joinedRoom(socket, user);
				}
				else {
					socket.emit('password');
				}
			});
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
			if (user.id === rooms[user.roomId].drawerId) {
				//drawer just left the room, gg
				console.log('Drawer left room');
			}
			rooms[data.roomId].users.splice(rooms[data.roomId].users.indexOf(user), 1);
			if (rooms[data.roomId].users.length == 0) {
				rooms[data.roomId] = null;
				console.log('Destroyed room id: ' + data.roomId);
			}
			console.log('Abandoned user id: ' + user.id);
		});
	});
}

function joinedRoom(socket, user) {
	var userList = '';
	for (var i = 0; i < rooms[user.roomId].users.length; i++) {
		userList += (i == 0 ? '' : ', ') + (i == rooms[user.roomId].drawerIndex ? '[D]' : '') + rooms[user.roomId].users[i].username;
	}
	if (rooms[user.roomId].users.length == 1) {
		rooms[user.roomId].newWord(words);
		rooms[user.roomId].newDrawer();
		io.to(user.roomId).emit('updateDrawer', {drawerId: rooms[user.roomId].getDrawer().id});
		rooms[user.roomId].getDrawer().socket.emit('word', {
			word: rooms[user.roomId].word
		});
	}
	io.to(user.roomId).emit('updateUserList', {userList: userList});
	io.to(user.roomId).emit('chat', {user: 'sys', message: user.username + ' has joined the room.'});
	socket.on('setUsername', function(data) {
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
		if (data.message.toLowerCase() === rooms[user.roomId].word) {
			//bird is the word
			rooms[user.roomId].newWord(words);
			rooms[data.roomId].newDrawer();
			io.to(data.roomId).emit('updateDrawer', {drawerId: rooms[data.roomId].getDrawer().id});
			rooms[user.roomId].getDrawer().socket.emit('word', {
				word: rooms[user.roomId].word
			});
		}
		io.to(user.roomId).emit('chat', {
			user: user.username,
			message: data.message
		});
	});
}