var express = require('express');
var logfmt = require('logfmt'); //heroku logger
var app = express();
var http = require('http');
var cors = require('cors');
var db = require('monk')(process.env.MONGOLAB_URI || 'localhost/rail');
var baner = db.get('baner');

var ALLOW_CORS = process.env.MONGOLAB_URI != '' ? true : false ;

var openPort = Number(process.env.PORT || 8080);
if (ALLOW_CORS) {
	console.log('!!!! CORS active!');
	app.use(cors());
}
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
app.get('/rail/view/:id', handleViewQuery);

function baneSjefer(request, response){
	baner.find({}, '-baner.banestrekninger', function(err, docs){
		if (err) {
			console.log(err);
		} else {
			var ret = [];
			for (var i = 0; i < docs.length; i++) {
				for (var j = 0; j < docs[i].baner.length; j++) {
					ret.push(docs[i].baner[j]);
				};
			};
			//response.send(ret);
			response.json(docs);
		}
	/*listAllLinesInArea('', function(json){
		response.json(json);*/
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
			//response.json(ret);
			response.json(docs);
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
			//response.json(ret);
			response.json(docs);
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

function handleViewQuery(request, response){
	var requestedArea = request.params.id;
	console.log(requestedArea);
	var returnValue;
	if (requestedArea === 'Norway') {
		generateCoordinatesForNorway(returnValue);
	} else {
		databaseLocateWantedLocation(requestedArea, function (area) {
			if (area.omrade === requestedArea) {
				generateCoordinatesForArea(returnValue, docs);
			} else {
				for (var i = 0; i < area.baner.length; i++) {
					var isStretch = false;
					if (area.baner[i].banesjef === requestedArea) {
						generateCoordinatesForLine(returnValue, area.baner[i]);
						break;
					} else {
						for (var j = 0; j < area.baner[i].banestrekninger.length; j++) {
							if (area.baner[i].banestrekninger[j].banestrekning) {
								generateCoordinatesForStretch(returnValue, area.baner[i].banestrekninger[j]);
								//returnValue = area.baner[i].banestrekninger[j];
								isStretch = true;
								break;
							}
						};
					}
					if (isStretch) {
						break;
					}
				};
			}
		});
		response.send(returnValue);
	};
	response.send(500);
}


function databaseLocateWantedLocation(areaName, callback) {
	baner.find({ $or: [ {omrade: areaName },
		{baner: { $elemMatch: { banesjef: areaName } } }, 
		{baner: { $elemMatch: { banestrekninger: { $elemMatch: { banestrekning: areaName } } } } } ] }, 
		 function(err, docs){
		if (err) {
			console.log(err);
		} else {
			console.log(docs);
			callback(docs);
		}
	});
}

function generateCoordinatesForNorway (returnValue) {
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

function generateCoordinatesForArea (returnValue, area) {
}

function generateCoordinatesForLine (returnValue, line) {
	var subStretches = '[';
	for (var i = 0; i < line.banestrekninger.length; i++) {
		if (i > 0) {
			subStretches += '';
		}
		generateCoordinatesForStretch(subStretches, line.banestrekninger[i]);
	};
	subStretches += ']';
	var stretchesCounter = 0;
	var lat = 0;
	var lon = 0;
	for (var i = 0; i < subStretches.length; i++) {
		stretchesCounter++;
		lat += subStretches[i].geometry.coordinates[0];
		lon += subStretches[i].geometry.coordinates[1];
	};
	lat = lat / stationCounter;
	lon = lon / stationCounter;
	returnValue += '{ "type": "Feature",' +
                '"properties": {' +
                  '"type": "node",' +
                  '"tags": {' +
                    '"name": ' + line.banesjef + 
                  '}' +
                '},' +
                '"geometry": {' +
                  '"type": "Point",' +
                  '"coordinates": [' +
                    + lat + ',' +
                    + lon + 
                  ']' +
                '}' +
              '}';
}

function generateCoordinatesForStretch (returnValue, stretch) {
	var stationCounter = 0;
	var lat = 0;
	var lon = 0;
	for (var i = 0; i < stretch.stasjoner.length; i++) {
		stationCounter++;
		lat += stretch.stasjoner[i].geometry.coordinates[0];
		lon += stretch.stasjoner[i].geometry.coordinates[1];
	};
	lat = lat / stationCounter;
	lon = lon / stationCounter;
	returnValue += '{ "type": "Feature",' +
                '"properties": {' +
                  '"type": "node",' +
                  '"tags": {' +
                    '"name": ' + stretch.banestrekning + 
                  '}' +
                '},' +
                '"geometry": {' +
                  '"type": "Point",' +
                  '"coordinates": [' +
                    + lat + ',' +
                    + lon + 
                  ']' +
                '}' +
              '}';
}
