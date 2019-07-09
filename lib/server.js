// Server-related tasks

// Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var fs = require('fs');
var path = require('path');
var StringDecoder = require('string_decoder').StringDecoder;

var config = require('./config');
var handlers = require('./handlers');
var helpers = require('./helpers');

// Instantiate the server module object
var server = {};

// Instantiate HTTP server
server.httpServer = http.createServer(function(req, res){
    server.unifiedServer(req, res);
});

// Instantiate HTTPS server
server.httpsServerOptions =   {
    'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions, function(req, res){
    server.unifiedServer(req, res);
});

// common logic for both http and https server
server.unifiedServer = function(req, res) {
    // Get the URL and parse it
    var parsedUrl = url.parse(req.url, true);

    // Get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get query string as an object
    var queryStringObject = parsedUrl.query;

    // Get the HTTP method
    var method = req.method.toLowerCase();

    // Get the headers as an object
    var headers = req.headers;

    // Get the payload, if any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function(data){
        buffer += decoder.write(data);
    });
    req.on('end', function(){
        buffer += decoder.end();

        // choose the handler for this request, if not found call notfound handler.
        var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notfound;

        // construct data object to send to the handler
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };

        // Route the request to the handler specified in the router
        chosenHandler(data, function(statusCode, payload){

            // use the status code or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200 ;

            // use the payload or default to an empty object
            payload = typeof(payload) == 'object' ? payload : {};

            // convert the payload to a string
            var payloadString = JSON.stringify(payload);

            // Send the response
            res.setHeader('content-type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
        });
    });
};

// Define a request router

server.router = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'checks': handlers.checks
};

// Init script
server.init = function(){
    // start the HTTP server
    server.httpServer.listen(config.httpPort, function(){
        console.log(`Server is listening of port: ${config.httpPort} in ${config.envName} mode`);
    });

    // start the HTTPS server
    server.httpsServer.listen(config.httpsPort, function(){
        console.log(`Server is listening of port: ${config.httpsPort} in ${config.envName} mode`);
    });
};

module.exports = server;