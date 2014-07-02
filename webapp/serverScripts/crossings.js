var pg = require('pg');
var pgConString = "postgres://krane:KranesLasteBil@Postgres@ds1.baess.no/krane";
var mongoDB = require('monk')(process.env.MONGOLAB_URI || 'localhost/rail');
var baner = mongoDB.get('baner');
var http = require('http');

/* REST methods */ 
module.exports = {
	/* Finds and return with the wanted stretch director */
	baneSjefer: function(request, response){
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
				//response.send(ret);		//Only stations
				response.json(docs);		//Unfiltered
			}
		});
	},

	/* Finds and return with the wanted area director */
	omradeSjefer: function(request, response){
		baner.find({}, '-baner -_id', function(err, docs){
			if (err) {
				console.log(err);
			} else {
				var ret = [];
				for (var i = 0; i < docs.length; i++) {
						ret.push(docs[i].omrade);
					
				};
				//response.json(ret);		//Only areas
				response.json(docs);		//Unfiltered
			}
		});
	},

	/* Finds and return with the wanted segment director */
	seksjoner: function(request, response){
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
				//response.json(ret);		//Only segments
				response.json(docs);		//Unfiltered
			}
		});
	},

	/* Finds and return with the wanted stations */
	station: function(request, response){
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
				response.json(features);		//All stations
				//response.json(docs);			//Unfiltered
			}
		});
	},

	/* Finds and return with the wanted stakeholder */
	handleViewQuery: function(request, response){
		var requestedArea = request.params.id;
	    var returnValue = "";
		if (requestedArea === 'Norge') {		//All of Norway
			returnValue = generateCoordinatesForNorway(function (returnObjectForNorway) {
				response.json(returnObjectForNorway);
			});
		} else {
			databaseLocateWantedLocation(requestedArea, response, function (area) {
				console.log(area);
				if (area[0].omrade === requestedArea) {		
					//Wanted stakeholder is an area director
					returnValue = generateCoordinatesForArea(area[0]);
				} else {
					for (var i = 0; i < area[0].baner.length; i++) {
						var isStretch = false;
						if (area[0].baner[i].banesjef === requestedArea) {
							//Wanted stakeholder is an stretch director
							returnValue = generateCoordinatesForLine(area[0].baner[i]);
							break;
						} else {
							for (var j = 0; j < area[0].baner[i].banestrekninger.length; j++) {
								if (area[0].baner[i].banestrekninger[j].banestrekning === requestedArea) {
									//Wanted stakeholder is an segment director
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
	},

	/* Finds and return with the number of crossing for 
	selected stations within selected time window */
	pgDbFetchCrossingsByStationsAndTime: function (request, response) {
		var fromDate = request.params.fromDate;
		var toDate = request.params.toDate;
		var requestedArea = request.params.id; 
		databaseLocateWantedLocation(requestedArea, response, function (area) {
			var stations = [];
			if (area[0].omrade === requestedArea) {
				for (var i = 0; i < area[0].baner.length; i++) {
					for (var j = 0; j < area[0].baner[i].banestrekninger.length; j++) {
						for (var k = 0; k < area[0].baner[i].banestrekninger[j].stasjoner.length; k++) {
							stations.push(area[0].baner[i].banestrekninger[j].stasjoner[k].properties.tags.name);
						};
					};
				};
			} else {
				for (var i = 0; i < area[0].baner.length; i++) {
					var bane = area[0].baner[i];
					if (bane.banesjef === requestedArea) {
						for (var j = 0; j < bane.banestrekninger.length; j++) {
							var strekning = bane.banestrekninger[j];
							for (var i = 0; i < strekning.stasjoner.length; i++) {
								stations.push(strekning.stasjoner[i].properties.tags.name);
							};
						};
						break;
					}
					var isStretch = false;
					var isStation = false;
					for (var j = 0; j < bane.banestrekninger.length; j++) {
						var strekning = bane.banestrekninger[j];
						if (strekning.banestrekning === requestedArea) {
							isStretch = true;
							for (var k = 0; k < strekning.stasjoner.length; k++) {
								stations.push(strekning.stasjoner[k].properties.tags.name);
							}
							break;
						} else {
							for (var k = 0; k < strekning.stasjoner.length; k++) {
								var stasjon = strekning.stasjoner[k];
								if (stasjon.properties.tags.name === requestedArea) {
									stations.push(stasjon.properties.tags.name);
									isStation = true;
									break;
								}
							};
							if (isStation) {
								break;
							}
						}
					};
					if (isStretch || isStation) {
						break;
					}
				};
			}
			fetchSeveralStationsFromDatabase(response, fromDate, toDate, stations);
			//response.json(returnValue);
		});
	},

	/* Find top 5 stations with crossings.
	Not completely working and not integrated with front-end */
	pgDbFetchTop5Crossings: function (equest, response) {
		var fromDate = request.params.fromDate;
		var toDate = request.params.toDate;
		var requestedArea = request.params.id; 
		databaseLocateWantedLocation(requestedArea, response, function (area) {
			var stations = [];
			if (area[0].omrade === requestedArea) {
				for (var i = 0; i < area[0].baner.length; i++) {
					for (var j = 0; j < area[0].baner[i].banestrekninger.length; j++) {
						for (var k = 0; k < area[0].baner[i].banestrekninger[j].stasjoner.length; k++) {
							stations.push(area[0].baner[i].banestrekninger[j].stasjoner[k].properties.tags.name);
						};
					};
				};
			} else {
				for (var i = 0; i < area[0].baner.length; i++) {
					var bane = area[0].baner[i];
					if (bane.banesjef === requestedArea) {
						for (var j = 0; j < bane.banestrekninger.length; j++) {
							var strekning = bane.banestrekninger[j];
							for (var i = 0; i < strekning.stasjoner.length; i++) {
								stations.push(strekning.stasjoner[i].properties.tags.name);
							};
						};
						break;
					}
					var isStretch = false;
					var isStation = false;
					for (var j = 0; j < bane.banestrekninger.length; j++) {
						var strekning = bane.banestrekninger[j];
						if (strekning.banestrekning === requestedArea) {
							isStretch = true;
							for (var k = 0; k < strekning.stasjoner.length; k++) {
								stations.push(strekning.stasjoner[k].properties.tags.name);
							}
							break;
						} else {
							for (var k = 0; k < strekning.stasjoner.length; k++) {
								var stasjon = strekning.stasjoner[k];
								if (stasjon.properties.tags.name === requestedArea) {
									stations.push(stasjon.properties.tags.name);
									isStation = true;
									break;
								}
							};
							if (isStation) {
								break;
							}
						}
					};
					if (isStretch || isStation) {
						break;
					}
				};
			}
			fetchSeveralStationsFromDatabase(response, fromDate, toDate, stations);
		});
	}
}
/* Locates the wanted stakeholder in the hierarchy, returns with the area the stakeholder belongs too */
function databaseLocateWantedLocation (areaName, response, callback) {
	baner.find({ $or: [ {omrade: areaName },
		{baner: { $elemMatch: { banesjef: areaName } } }, 
		{baner: { $elemMatch: { banestrekninger: { $elemMatch: { banestrekning: areaName } } } } },
		{baner: { $elemMatch: { banestrekninger: { $elemMatch: { stasjoner: { $elemMatch: { "properties.tags.name": areaName } } } } } } } ] }, 
		 function(err, docs){
		if (err) {
			console.log(err);
			response.send(500)
		} else {
			if (docs.length > 0) {
				callback(docs);
			} else {
				console.log(docs);
				response.send(500);
			}
		}
	});
}

/* Generates markers for each area, returning all areas in Norway */
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

/* Generates a dummy marker for a area, based on all stretches */
function generateDummyClusterForArea (area) {
	var lat = 0;
	var lon = 0;
	/*"ost" and "oslo" gets special coordinates for avoiding that
	they plots on top of eachother, not optimal */
	if (area.omrade === 'ost' ) {
			lon = 59.37309;
			lat = 11.24451;
	} else if (area.omrade === 'oslo') {
			lon = 60.20162;
			lat = 11.27472;
	} else {
		var subStretchesArray = generateCoordinatesForArea(area);
		for (var i = 0; i < subStretchesArray.length; i++) {
			lat += subStretchesArray[i].geometry.coordinates[0];
			lon += subStretchesArray[i].geometry.coordinates[1];
		};

		lat = lat / subStretchesArray.length;
		lon = lon / subStretchesArray.length;
	}

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

/* Generates markers for each stretch, returning all stretches within a area */
function generateCoordinatesForArea (area) {
	var subStretchesArray = [];
	for (var i = 0; i < area.baner.length; i++) {
		subStretchesArray.push(generateDummyClusterForLine(area.baner[i]));
	};

	return subStretchesArray;
}

/* Generates a dummy marker for a stretch, based on all segments */
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

/* Generates markers for each segment, returning all segments within a stretch */
function generateCoordinatesForLine  (line) {
	var subStretchesArray = [];
	for (var i = 0; i < line.banestrekninger.length; i++) {
		subStretchesArray.push(generateDummyClusterForStretch(line.banestrekninger[i]));
	};

	return subStretchesArray;
}

/* Generates a dummy marker for a segments, based on all stations */
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

/* returning all stations within a segment */
function generateCoordinatesForStretch (stretch) {
	var returnValue = [];
	for (var i = 0; i < stretch.stasjoner.length; i++) {
		returnValue.push(stretch.stasjoner[i]);
	};
	return returnValue;
}

/* Query to db for finding crossings */
function fetchSeveralStationsFromDatabase (response, fromDate, toDate, stations) {
    var rows = [];
    var fromDateTime = new Date(fromDate).getTime() / 1000;
    var toDateTime = new Date(toDate).getTime() / 1000;

    pg.connect(pgConString, function(err, client, done) {
		if(err) {
			response.send('error fetching client from pool', err);
		}

		var queryString = 'SELECT a_tog_nr, b_tog_nr from kryss where a_stasjon_kd in (';

		for (var i = 0; i < stations.length-1; i++) {
			queryString += '\'' + stations[i] + '\',';
		};
		queryString += '\'' + stations[stations.length-1] + '\') AND a_atd_tid >= \'' + fromDateTime +
    						'\' AND a_atd_tid <= \'' + toDateTime + '\'';
		//console.log(queryString);
	  	var query = client.query(queryString);
	  
	    query.on('row', function(row) {
	      //fired once for each row returned
	      rows.push(row);
	    });

	    query.on('end', function(result) {
		  	//fired once and only once, after the last row has been returned and after all 'row' events are emitted
		  	//in this example, the 'rows' array now contains an ordered set of all the rows which we received from postgres
		 	console.log(result.rowCount + ' rows were received');
		 	var crossings = {
		 		numberOfCrossings: result.rowCount
		 	}
		 	result.rows = rows;
			response.send(crossings);
		})
	});
}
