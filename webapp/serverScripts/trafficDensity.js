var http = require('http');
var mongoDB = require('monk')(process.env.MONGOLAB_URI || 'localhost/rail');
var baner = mongoDB.get('baner');
module.exports = {
	fetchTrafficDensity: function (request, response) {
		var req = http.get('http://ds1.baess.no:8132/rail/trafficDensityWithTime/' + request.params.fromStation + '/' +
							request.params.toStation + '/' + request.params.fromDate +
							'/' + request.params.toDate, function(res) {
		  //console.log('STATUS: ' + res.statusCode);
		  //console.log('HEADERS: ' + JSON.stringify(res.headers));

		  // Buffer the body entirely for processing as a whole.
		  var bodyChunks = "";
		  res.on('data', function(chunk) {
		    // You can process streamed parts here...
		    bodyChunks += chunk;
		  }).on('end', function() {
		    var body = JSON.parse(bodyChunks);
		    console.log('BODY: ' + body);
		    // ...and/or process the entire body here. 
		    response.json(body);
		  })
		});

		req.on('error', function(e) {
		  console.log('ERROR: ' + e.message);
		  response.send(0);
		});
	}	
}


/*pgDbFetchCrossingsByStationsAndTime: function (request, response) {
		var fromDate = request.params.fromDate;
		var toDate = request.params.toDate;
		var toStation = request.params.toStation; 
		var fromStation = request.params.fromStation; 
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
	},*/

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
