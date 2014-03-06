var express = require('express');
var logfmt = require('logfmt'); //heroku logger
var app = express();
var http = require('http');



var openPort = Number(process.env.PORT || 8080);

app.use(logfmt.requestLogger());

//Static file serving from public directory
app.use(express.static(__dirname + '../webapp/dist/')); //or whatever you want it to be

//Alternative 1, nice if you need to do more with the webserver, fx. use websockets
var server = http.createServer(app);
server.listen(openPort, function(){
  console.log('Listening on port ' + openPort);	
});

//alternative 2
/*
app.listen(openPort, function(){
  console.log('Listening on port ' + openPort);	
});
*/
