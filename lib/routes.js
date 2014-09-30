module.exports = function(app, uuid) {
	app.engine('jade', require('jade').__express);
	app.set('view engine', 'jade');
  app.set('views', process.cwd() + '/views');
	app.get('/', function (req, res) {
	  res.render('index', {roomId: uuid.v4()});
	});
	app.get('/g/*', function (req, res) {
	  res.render('game', {roomId: req.params[0]});
	});
	app.get('/assets/*', function (req, res) {
	  res.sendFile(process.cwd() + '/public/assets/' + req.params[0]);
	});
}