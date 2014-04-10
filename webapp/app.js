var express = require('express');
var logfmt = require('logfmt'); //heroku logger
var app = express();
var http = require('http');
var db = require('monk')(process.env.MONGOLAB_URI || 'localhost/rail');
var baner = db.get('baner');



var openPort = Number(process.env.PORT || 8080);

app.use(logfmt.requestLogger());

//Static file serving from public directory
app.use(express.static(__dirname + '/dist')); //or whatever you want it to be

//Alternative 1, nice if you need to do more with the webserver, fx. use websockets
var server = http.createServer(app);
server.listen(openPort, function(){
  console.log('Listening on port ' + openPort);	
});

//app.get('/rail/stretches', baneSjefer);
app.get('/rail/stretches', omradeSjefer);

function baneSjefer(request, response){
	baner.find({}, '-baner.banestrekninger.stasjoner', function(err, docs){
		if (err) {
			console.log(err);
		} else {
			response.json(docs);
		}
	});
}

function omradeSjefer(request, response){
	baner.find({}, '-baner.banestrekninger', function(err, docs){
		if (err) {
			console.log(err);
		} else {
			response.json(docs);
		}
	});
}
