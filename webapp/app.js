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
	//var returnValue = '{ "type": "FeatureCollection",' +
    //            						'"features": [';
    var returnValue = "";
	if (requestedArea === 'Norge') {
		generateCoordinatesForNorway(returnValue);
	} else {
		databaseLocateWantedLocation(requestedArea, response, function (area) {
			if (area[0].omrade === requestedArea) {
				returnValue = generateCoordinatesForArea(area[0]);
			} else {
				for (var i = 0; i < area[0].baner.length; i++) {
					var isStretch = false;
					if (area[0].baner[i].banesjef === requestedArea) {
						returnValue = generateCoordinatesForLine(area[0].baner[i]);
						break;
					} else {
						for (var j = 0; j < area[0].baner[i].banestrekninger.length; j++) {
							if (area[0].baner[i].banestrekninger[j].banestrekning === requestedArea) {
								//returnValue += generateCoordinatesForStretch(returnValue, area[0].baner[i].banestrekninger[j]);
								returnValue = area[0].baner[i].banestrekninger[j];
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
			//returnValue += ']' +
			//			 '}';
			response.json(returnValue);
		});
	};
}


function databaseLocateWantedLocation(areaName, response, callback) {
	baner.find({ $or: [ {omrade: areaName },
		{baner: { $elemMatch: { banesjef: areaName } } }, 
		{baner: { $elemMatch: { banestrekninger: { $elemMatch: { banestrekning: areaName } } } } } ] }, 
		 function(err, docs){
		if (err) {
			console.log(err);
			response.send(500)
		} else {
			console.log(docs);
			if (docs.length > 0) {
				callback(docs);
			} else {
				response.send(500);
			}
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
			//response.json(ret);
			//response.json(docs);
			return ret;
		}
	});
}

function generateDummyClusterForArea (area) {
	var subStretchesArray = [];
	for (var i = 0; i < area.baner.length; i++) {
		subStretchesArray.push(generateCoordinatesForLine(area.baner[i]));
	};
	var stretchesCounter = 0;
	var lat = 0;
	var lon = 0;
	for (var i = 0; i < subStretchesArray.length; i++) {
		stretchesCounter++;
		lat += subStretchesArray[i].geometry.coordinates[0];
		lon += subStretchesArray[i].geometry.coordinates[1];
	};
	lat = lat / stretchesCounter;
	lon = lon / stretchesCounter;
	//console.log(area);
	var newLocation = new Object();
	newLocation.type = "Feature";
	var properties = new Object();
	properties.type = "node";
	var tags = new Object();
	tags.name = area.omrade;
	properties.tags = tags;
	newLocation.properties = properties;

	var geometry = new Object();
	geometry.type = "Point";
	var coordinates = [];
	coordinates.push(lat);
	coordinates.push(lon);
	geometry.coordinates = coordinates;
	newLocation.geometry = geometry;

	return newLocation;
}

function generateCoordinatesForArea (area) {
	var subStretchesArray = [];
	for (var i = 0; i < area.baner.length; i++) {
		subStretchesArray.push(generateDummyClusterForLine(area.baner[i]));
	};

	return subStretchesArray;
}

function generateDummyClusterForLine (line) {
	var subStretchesArray = [];
	for (var i = 0; i < line.banestrekninger.length; i++) {
		subStretchesArray.push(generateDummyClusterForStretch(line.banestrekninger[i]));
	};
	var stretchesCounter = 0;
	var lat = 0;
	var lon = 0;
	for (var i = 0; i < subStretchesArray.length; i++) {
		stretchesCounter++;
		lat += subStretchesArray[i].geometry.coordinates[0];
		lon += subStretchesArray[i].geometry.coordinates[1];
	};
	lat = lat / stretchesCounter;
	lon = lon / stretchesCounter;

	var newLocation = new Object();
	newLocation.type = "Feature";
	var properties = new Object();
	properties.type = "node";
	var tags = new Object();
	tags.name = line.banesjef;
	properties.tags = tags;
	newLocation.properties = properties;

	var geometry = new Object();
	geometry.type = "Point";
	var coordinates = [];
	coordinates.push(lat);
	coordinates.push(lon);
	geometry.coordinates = coordinates;
	newLocation.geometry = geometry;

	return newLocation;
}

function generateCoordinatesForLine (line) {
	var subStretchesArray = [];
	for (var i = 0; i < line.banestrekninger.length; i++) {
		subStretchesArray.push(generateDummyClusterForStretch(line.banestrekninger[i]));
	};

	return subStretchesArray;
}

function generateDummyClusterForStretch (stretch) {
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

	var newLocation = new Object();
	newLocation.type = "Feature";
	var properties = new Object();
	properties.type = "node";
	var tags = new Object();
	tags.name = stretch.banestrekning;
	properties.tags = tags;
	newLocation.properties = properties;

	var geometry = new Object();
	geometry.type = "Point";
	var coordinates = [];
	coordinates.push(lat);
	coordinates.push(lon);
	geometry.coordinates = coordinates;
	newLocation.geometry = geometry;

	return stretch;
}
