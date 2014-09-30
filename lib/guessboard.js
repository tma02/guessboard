var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var uuid = require('uuid');
var socketEventHandler = require('./socket-event-handler');

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
			versionOkay(socket, require('./user')(uuid.v4(), socket, 'test'));
		}
		else {
			socket.emit('version', {success: false});
		}
	});
});

function versionOkay(socket, user) {
	socket.emit('userId', user.uuid);
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
		socket.emit('joinedRoom', {roomId: data.roomId});
		joinedRoom(socket, user);
	});
}

function joinedRoom(socket, user) {
	socket.on('setUsername', function(data) {
		user.username = data.username;
	});
	socket.on('draw', function(data) {
		io.to(user.roomId).emit('draw', {
			userId: user.uuid,
			x: data.x,
			y: data.y,
			lastX: data.lastX,
			lastY: data.lastY,
			color: data.color
		});
	});
	socket.on('chat', function(data) {
		if (data.message.toLowerCase() === rooms[user.roomId].word) {
			//bird is the word
			rooms[user.roomId].newWord(words);
			io.to(user.roomId).emit('word', {
				word: rooms[user.roomId].word
			});
		}
		io.to(user.roomId).emit('chat', {
			user: user.nickname,
			message: data.message
		});
	});
}