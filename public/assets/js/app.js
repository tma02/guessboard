$(function() {
	var version = '1';
	var inRoom = false;
	var self = {};
  var username = '';

	var lastX = 0;
	var lastY = 0;
	var paint = false;
  var canPaint = false;
	var color = "#333";
  var timeLeft = 0;
  var maxTime = 60;
  var socket = {};
	$('#gameCanvas').attr('width', $('#canvasContainer').width());
  $('#everything').hide();
  $('#usernameModal').modal({
    backdrop: 'static',
    keyboard: false
  });
  $('#color').spectrum({
    color: "#333"
  });

  $('#usernameInput').keypress(function(e) {
    if(e.which == 13) {
      if ($(this).val() === '') {
        return;
      }
      username = $('#usernameInput').val();
      $('#usernameModal').modal('hide');
      connect();
    }
  });
	
  function connect() {
    socket = io('http://localhost', {
      reconnection: false
    });

    socket.on('version', function (data) {
      if (data.success) {
        versionOkay();
        return;
      }
      socket.emit('version', {version: version, username: username, password: ''});
    });

    socket.on('disconnect', function() {
      $('#messages').append($('<li>').text("Disconnected from server."));
      $("#messages").scrollTop($("#messages")[0].scrollHeight);
    });

    socket.on('dcerror', function (data) {
      $('#errorBody').html(data.message);
      $('#errorHeader').html(data.title);
      $('#errorModal').modal({
        backdrop: 'static',
        keyboard: false
      });
    });
  }

  function versionOkay() {
  	socket.emit('joinRoom', {roomId: roomId});
  	socket.on('joinedRoom', function(data) {
  		//start stuff
  		console.log(data);
  		$('#users').html(data.userList);
  		inRoom = true;
  		joinedRoom();
  	});
    socket.on('userId', function(data) {
      self.id = data;
    });
  }

  function joinedRoom() {
  	console.log('game start');
  	$('#everything').show();
    setInterval(function() {
      if (timeLeft > 0) {
        timeLeft--;
      }
      $('#timer').css('width', ((timeLeft / maxTime) * 100) + '%');
    }, 1000);

  	socket.on('draw', function(data) {
  		console.log(data.userId);
  		if (data.userId !== self.id) {
  			addClick(data.x, data.y, data.lastX, data.lastY, data.color, false);
  		}
  	});

  	socket.on('chat', function(data) {
      var bold = data.user === 'sys';
  		$('#messages').append($('<li>').html(function() {
        var content = $(bold ? '<b>' : '<p>').text(data.user + ': ' + data.message);
        return bold ? $('<div>').html(content).html() : content.html();
      }));
  		$("#messages").scrollTop($("#messages")[0].scrollHeight);
  	});

  	socket.on('updateUserList', function(data) {
  		$('#users').html(data.userList);
  	});

    socket.on('updateDrawer', function(data) {
      console.log('new drawer ' + data.drawerId);
      canPaint = (data.drawerId === self.id);
      clear();
    });

    socket.on('timerUpdate', function(data) {
      timeLeft = data.timeLeft;
      maxTime = data.maxTime;
    });

    $('#chatbar').keypress(function(e) {
      if(e.which == 13) {
        if ($(this).val() === '') {
          return;
        }
        socket.emit('chat', {message: $(this).val()});
        $(this).val('');
      }
    });

  	$('#gameCanvas').mousedown(function(e) {
  	  lastX = e.pageX - this.parentNode.offsetLeft - this.offsetLeft;
  	  lastY = e.pageY - this.parentNode.offsetTop - this.offsetTop;
  	  paint = true;
  	  //sorry about this hacky stuff
  		addClick(lastX, lastY, lastX + 1, lastY, $('#color').spectrum('get').toHexString(), true);
  	});

  	$('body').mouseup(function(e) {
  		paint = false;
  	});

  	$('#gameCanvas').mousemove(function(e) {
  	  var mouseX = e.pageX - this.parentNode.offsetLeft - this.offsetLeft;
  	  var mouseY = e.pageY - this.parentNode.offsetTop - this.offsetTop;
  	  if (paint) {
  	  	addClick(mouseX, mouseY, lastX, lastY, $('#color').spectrum('get').toHexString(), true);
  	  }
  	  lastX = mouseX;
  	  lastY = mouseY;
  	});

  	function addClick(x, y, lastX, lastY, color, localDraw) {
      if (canPaint || !localDraw) {
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
  	}

  	function clear() {
  		var context = document.getElementById('gameCanvas').getContext("2d");
  		context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  	}
  }
  
});