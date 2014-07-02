var pg = require('pg');
var pgConString = "postgres://krane:KranesLasteBil@Postgres@ds1.baess.no/krane";
var mongoDB = require('monk')(process.env.MONGOLAB_URI || 'localhost/rail');
var baner = mongoDB.get('baner');

/* REST methods */ 
module.exports = {

	/* Calls on db method for finding speed restrictions */ 
	fetchSlowDrivingStationFromPg: function(request, response){
		var requestedArea = request.params.id;
	    console.log(requestedArea);
	    fetchSlowDrivingFromDatabase(response);
	}
}

/* Call to db for finding all speed restrictions */
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

/* Find all stations within a speed restriction */
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

/* Generate a dummy marker for a speed restriction */
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
