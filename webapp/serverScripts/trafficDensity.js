var http = require('http');
var mongoDB = require('monk')(process.env.MONGOLAB_URI || 'localhost/rail');
var baner = mongoDB.get('baner');
module.exports = {

	/* As this database was given as an interface, this method calls on a server put
	up with static IP, see folder psuamQueryServer  */

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
