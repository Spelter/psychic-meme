var pg = require('pg');
var pgConString = "postgres://krane:KranesLasteBil@Postgres@ds1.baess.no/krane";
var mongoDB = require('monk')(process.env.MONGOLAB_URI || 'localhost/rail');
var baner = mongoDB.get('baner');
module.exports = {
	fetchSlowDrivingStationFromPg: function(request, response){
		var requestedArea = request.params.id;
	    console.log(requestedArea);
	    fetchSlowDrivingFromDatabase(response);
		/*databaseLocateWantedLocation(requestedArea, response, function (area) {
			var stations = [];
			console.log(area);
			for (var i = 0; i < area[0].baner.length; i++) {
				for (var j = 0; j < area[0].baner[i].banestrekninger.length; j++) {
					for (var k = 0; k < area[0].baner[i].banestrekninger[j].stasjoner.length; k++) {
						if (area[0].baner[i].banestrekninger[j].stasjoner[k].properties.tags.name === )
					};
				};
			};
			response.json(returnValue);
		});*/
	}
}

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

function fetchSlowDrivingFromDatabase (response) {
    var rows = [];

    pg.connect(pgConString, function(err, client, done) {
		if(err) {
			response.send('error fetching client from pool', err);
		}

		var queryString = 'SELECT DISTINCT id, fromStation, toStation from saktekjoring';
	  	var query = client.query(queryString);
	  
	    query.on('row', function(row) {
	      rows.push(row);
	    });

	    query.on('end', function(result) {
		 	var crossings = {
		 		numberOfCrossings: result.rowCount
		 	}
		 	result.rows = rows;
		 	fetchStationsCoordinates(response, rows);
			//response.send(rows);
		})
	});
}

function fetchStationsCoordinates (response, rows){
	baner.find({}, 'baner.banestrekninger.stasjoner', function(err, docs){
		if (err) {
			console.log(err);
		} else {
			for (var h = 0; h < rows.length; h++) {
				var fromStation = rows[h].fromstation;
				var toStation = rows[h].tostation;
				for (var i = 0; i < docs.length; i++) {
					for (var j = 0; j < docs[i].baner.length; j++) {
						for (var k = 0; k < docs[i].baner[j].banestrekninger.length; k++) {
							for (var l = 0; l < docs[i].baner[j].banestrekninger[k].stasjoner.length; l++) {
								if (docs[i].baner[j].banestrekninger[k].stasjoner[l].properties.tags.name === fromStation) {
									rows[h].fromstation = docs[i].baner[j].banestrekninger[k].stasjoner[j];
								} else if (docs[i].baner[j].banestrekninger[k].stasjoner[l].properties.tags.name === toStation) {
									rows[h].tostation = docs[i].baner[j].banestrekninger[k].stasjoner[j];
								}
							};
						};
					};
				};					
			};
			generateSlowDrivingMarkers(response, rows);
			//response.send(rows);
		}
	});
}

function generateSlowDrivingMarkers (response, slowDrivingIdAndStations) {
	var slowDrivingMarkers = [];
	for (var i = 0; i < slowDrivingIdAndStations.length; i++) {
		var lat = slowDrivingIdAndStations[i].fromstation.geometry.coordinates[0] + slowDrivingIdAndStations[i].tostation.geometry.coordinates[0];
		var lon = slowDrivingIdAndStations[i].fromstation.geometry.coordinates[1] + slowDrivingIdAndStations[i].tostation.geometry.coordinates[1];
		lat = lat / 2;
		lon = lon / 2;
		//console.log(slowDrivingIdAndStations[i].id);
		var newLocation = {
			type: 'Feature',
			properties: {
				type: 'node',
				tags: {
					name: slowDrivingIdAndStations[i].id
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
		slowDrivingMarkers.push(newLocation);
	};
	response.send(slowDrivingMarkers);
}
