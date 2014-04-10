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

app.get('/rail/area', omradeSjefer);
app.get('/rail/line', baneSjefer)
app.get('/rail/section', seksjoner);
app.get('/rail/station', station);


function baneSjefer(request, response){
	baner.find({}, '-baner.banestrekninger', function(err, docs){
		if (err) {
			console.log(err);
		} else {
			console.dir(docs);
			var ret = [];
			for (var i = 0; i < docs.length; i++) {
				for (var j = 0; j < docs[i].baner.length; j++) {
					ret.push(docs[i].baner[j]);
				};
				
			};
			response.json(ret);
			//response.json(docs);
		}
	});
}

function omradeSjefer(request, response){
	baner.find({}, '-baner -_id', function(err, docs){
		if (err) {
			console.log(err);
		} else {
			var ret = [];
			for (var i = 0; i < docs.length; i++) {
					ret.push(docs[i].omrade);
				
			};
			response.json(ret);
			//response.json(docs);
		}
	});
}

function seksjoner(request, response){
	baner.find({}, '-baner.banestrekninger.stasjoner', function(err, docs){
		if (err) {
			console.log(err);
		} else {
			var ret = [];
			for (var i = 0; i < docs.length; i++) {
				for (var j = 0; j < docs[i].baner.length; j++) {
					for (var k = 0; k < docs[i].baner[j].banestrekninger.length; k++) {
							ret.push(docs[i].baner[j].banestrekninger[k]);
					};
				};
			};
			response.json(ret);
			//response.json(docs);
		}
	});
}

function station(request, response){
	baner.find({}, 'baner.banestrekninger.stasjoner', function(err, docs){
		if (err) {
			console.log(err);
		} else {
			var features = {};
			features.type = "FeatureCollection";
			var ret = [];
			for (var i = 0; i < docs.length; i++) {
				for (var j = 0; j < docs[i].baner.length; j++) {
					for (var k = 0; k < docs[i].baner[j].banestrekninger.length; k++) {
						for (var l = 0; l < docs[i].baner[j].banestrekninger[k].stasjoner.length; l++) {
							ret.push(docs[i].baner[j].banestrekninger[k].stasjoner[l]);
						};
					};
				};
			};
			features.features = ret;
			response.json(features);
			//response.json(docs);
		}
	});
}

