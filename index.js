// Use the environment variable or use a given port
var PORT = process.env.PORT || 8080;
var express = require('express');
var server = express();

server.use(express.static(__dirname + '/public'));

server.listen(PORT, function() {
		console.log('Server listening on: http://localhost:%s', PORT);
});