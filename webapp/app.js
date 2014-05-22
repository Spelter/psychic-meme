var express = require('express');
var logfmt = require('logfmt'); //heroku logger
var app = express();
var http = require('http');
var cors = require('cors');
var pg = require('pg');
var pgConString = "postgres://krane:KranesLasteBil@Postgres@ds1.baess.no/krane";
var mongoDB = require('monk')(process.env.MONGOLAB_URI || 'localhost/rail');
var baner = mongoDB.get('baner');
var densityScripts = require('./serverScripts/trafficDensity.js');
var crossingsScripts = require('./serverScripts/crossings.js');
var slowDrivingScripts = require('./serverScripts/slowDriving.js');

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

app.get('/rail/area', crossingsScripts.omradeSjefer);
app.get('/rail/line', crossingsScripts.baneSjefer)
app.get('/rail/section', crossingsScripts.seksjoner);
app.get('/rail/station', crossingsScripts.station);
app.get('/rail/view/:id', crossingsScripts.handleViewQuery);
app.get('/rail/numberOfCrossings/:fromDate/:toDate/:id', crossingsScripts.pgDbFetchCrossingsByStationsAndTime);
app.get('/rail/crossingsTop5/:fromDate/:toDate/:id', crossingsScripts.pgDbFetchTop5Crossings);
app.get('/rail/trafficDensity/:fromStation/:toStation/:fromDate/:toDate', densityScripts.fetchTrafficDensity);
app.get('/rail/slowDriving', slowDrivingScripts.fetchSlowDrivingStationFromPg);

