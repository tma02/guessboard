$(function() {
	var version = '1';
	var inRoom = false;
	var self = {};

	var lastX = 0;
	var lastY = 0;
	var paint = false;
	var color = "#333333";
	$('#gameCanvas').attr('width', $('#canvasContainer').width());
  $('#everything').hide();

	var socket = io('http://localhost');
  socket.on('version', function (data) {
  	if (data.success) {
  		versionOkay();
  		return;
  	}
    socket.emit('version', {version: version});
  });

  function versionOkay() {
  	socket.emit('joinRoom', {roomId: roomId});
  	socket.on('joinedRoom', function(data) {
  		//start stuff
  		console.log(data);
  		$('#users').html(data.userList);
  		inRoom = true;
  		joinedRoom();
  	});
  }

  function joinedRoom() {
  	console.log('game start');
  	$('#everything').show();
  	socket.on('userId', function(data) {
  		self.id = data;
  	});

  	socket.on('draw', function(data) {
  		console.log(data.userId);
  		if (data.userId !== self.id) {
  			addClick(data.x, data.y, data.lastX, data.lastY, data.color, false);
  		}
  	});

  	socket.on('chat', function(data) {
  		$('#messages').append($('<li>').text(data.user + ': ' + data.message));
  		$("#messages").scrollTop($("#messages")[0].scrollHeight);
  	});

  	socket.on('updateUserList', function(data) {
  		$('#users').html(data.userList);
  	});

  	$('#gameCanvas').mousedown(function(e) {
  	  lastX = e.pageX - this.parentNode.offsetLeft - this.offsetLeft;
  	  lastY = e.pageY - this.parentNode.offsetTop - this.offsetTop;
  	  paint = true;
  	  //sorry about this hacky stuff
  		addClick(lastX, lastY, lastX + 1, lastY, color, true);
  	});

  	$('#gameCanvas').mouseup(function(e) {
  		paint = false;
  	});

  	$('#gameCanvas').mousemove(function(e) {
  	  var mouseX = e.pageX - this.parentNode.offsetLeft - this.offsetLeft;
  	  var mouseY = e.pageY - this.parentNode.offsetTop - this.offsetTop;
  	  if (paint) {
  	  	addClick(mouseX, mouseY, lastX, lastY, color, true);
  	  }
  	  lastX = mouseX;
  	  lastY = mouseY;
  	});

  	function addClick(x, y, lastX, lastY, color, localDraw) {
  		var context = document.getElementById('gameCanvas').getContext("2d");
  	  context.strokeStyle = color;
  	  context.lineJoin = "round";
  	  context.lineWidth = 5;
  	  context.beginPath();
  	  context.moveTo(lastX, lastY);
  	  context.lineTo(x, y);
  	  context.closePath();
  	  context.stroke();
  	  if (localDraw) {
  	  	socket.emit('draw', {x: x, y: y, lastX: lastX, lastY: lastY, color: color});
  	  }
  	}

  	function clear() {
  		var context = document.getElementById('gameCanvas').getContext("2d");
  		context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  	}
  }
  
});