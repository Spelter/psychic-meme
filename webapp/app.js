var express = require('express');
var logfmt = require('logfmt'); //heroku logger
var app = express();
var http = require('http');
var cors = require('cors');
var pg = require('pg');
var pgConString = "postgres://krane:KranesLasteBil@Postgres@ds1.baess.no/krane";
var mongoDB = require('monk')(process.env.MONGOLAB_URI || 'localhost/rail');
var baner = mongoDB.get('baner');

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
app.get('/rail/db', testDb);

function testDb (request, response) {
	var requestedArea = '(Elverum) - Koppang';
	databaseLocateWantedLocation(requestedArea, response, function (area) {
		for (var i = 0; i < area[0].baner.length; i++) {
			var isStretch = false;
			for (var j = 0; j < area[0].baner[i].banestrekninger.length; j++) {
				if (area[0].baner[i].banestrekninger[j].banestrekning === requestedArea) {
					returnValue = fetchSeveralStationsFromDatabase(area[0].baner[i].banestrekninger[j]);
					isStretch = true;
					break;
				}
			};
			if (isStretch) {
				break;
			}
		};
		response.json(returnValue);
	});
}

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
		returnValue = generateCoordinatesForNorway(function (returnObjectForNorway) {
			response.json(returnObjectForNorway);
		});
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
								returnValue = generateCoordinatesForStretch(area[0].baner[i].banestrekninger[j]);
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
			if (docs.length > 0) {
				callback(docs);
			} else {
				response.send(500);
			}
		}
	});
}

function generateCoordinatesForNorway (callback) {
	baner.find({}, function(err, docs){
		if (err) {
			console.log(err);
		} else {
			var subStretchesArray = [];
			for (var i = 0; i < docs.length; i++) {
				subStretchesArray.push(generateDummyClusterForArea(docs[i]));
			};
			callback(subStretchesArray);
		}
	});
}

function generateDummyClusterForArea (area) {
	var subStretchesArray = generateCoordinatesForArea(area);
	var lat = 0;
	var lon = 0;
	for (var i = 0; i < subStretchesArray.length; i++) {
		lat += subStretchesArray[i].geometry.coordinates[0];
		lon += subStretchesArray[i].geometry.coordinates[1];
	};

	lat = lat / subStretchesArray.length;
	lon = lon / subStretchesArray.length;

	var newLocation = {
		type: 'Feature',
		properties: {
			type: 'node',
			tags: {
				name: area.omrade
			}
		},
		geometry: {
			type: 'Point',
			coordinates: [
				lat,
				lon
			]
		}
	};

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
	var subStretchesArray = generateCoordinatesForLine(line);
	var lat = 0;
	var lon = 0;
	for (var i = 0; i < subStretchesArray.length; i++) {
		lat += subStretchesArray[i].geometry.coordinates[0];
		lon += subStretchesArray[i].geometry.coordinates[1];
	};
	lat = lat / subStretchesArray.length;
	lon = lon / subStretchesArray.length;

	var newLocation = {
		type: 'Feature',
		properties: {
			type: 'node',
			tags: {
				name: line.banesjef
			}
		},
		geometry: {
			type: 'Point',
			coordinates: [
				lat,
				lon
			]
		}
	};

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

	var newLocation = {
		type: 'Feature',
		properties: {
			type: 'node',
			tags: {
				name: stretch.banestrekning
			}
		},
		geometry: {
			type: 'Point',
			coordinates: [
				lat,
				lon
			]
		}
	};

	return newLocation;
}

function generateCoordinatesForStretch (stretch) {
	var returnValue = [];
	for (var i = 0; i < stretch.stasjoner.length; i++) {
		returnValue.push(stretch.stasjoner[i]);
	};
	return returnValue;
}

function fetchSeveralStationsFromDatabase (stretch) {
    var rows = [];

    var stations = [];
	for (var i = 0; i < stretch.stasjoner.length; i++) {
		stations.push(stretch.stasjoner[i].properties.tags.name);
	};

    pg.connect(pgConString, function(err, client, done) {
		if(err) {
			response.send('error fetching client from pool', err);
		}

		var queryString = 'SELECT * from kryss where a_stasjon_kd = OSL';

		/*for (var i = 0; i < stations.length-1; i++) {
			queryString += stations[i] + ',';
		};
		queryString += stations[stations.length-1] + ')';*/
		console.log(queryString);
	  	var query = client.query(queryString);
	  	console.log(query);
	    query.on('row', function(row) {
	      //fired once for each row returned
	      console.log(row);
	      rows.push(row);
	    });

	    query.on('end', function(result) {
		  //fired once and only once, after the last row has been returned and after all 'row' events are emitted
		  //in this example, the 'rows' array now contains an ordered set of all the rows which we received from postgres
		  console.log(result.rowCount + ' rows were received');
		})
		return rows;
	});
}
