'use strict';
const  express = require('express');
const  debug = require('debug')('main-index');
const  path = require('path');
const  app = express();
const  Twit = require('twit');
const  cors = require('cors');
const  fs = require('fs');
const  compress = require('compress');
const  json = require('json');

//const  methodOverride = require('methodOverride');
//const  urlencoded = require('urlencoded');
//const server = require('http').createServer(app);
const  http = require('http');
const  https = require('https');
const  privateKey  = fs.readFileSync('/var/www/html/privatekey.pem', 'utf8');
const  certificate = fs.readFileSync('/var/www/html/certificate.pem', 'utf8');
const  credentials = {key: privateKey, cert: certificate};
const  httpServer = http.createServer(app);
const  httpsServer = https.createServer(credentials, app);
//const io = require('socket.io')(server);
const io = require('socket.io')(httpServer);
const ios = require('socket.io')(httpsServer);

const PORT = 80;
const SSLPORT = 443;

var  tweet_stream_staus = false;
//var  socket_staus = false ;


httpServer.listen(PORT, function() {
    console.log('HTTP Server is running on:  ', PORT);
});

httpsServer.listen(SSLPORT, function() {
    console.log('HTTPS Server is running on:  ', SSLPORT);
});

// Welcome
/*
app.get('/', function(req, res) {
    if(req.protocol === 'https') {
        res.status(200).send('Welcome to Safety Land!');
    }
    else {
        res.status(200).send('Welcome!');
    }
});
*/
/*
import https from 'https';
import fs from 'fs';

//  privatekey and certificate path :/var/www/html/
var pk = fs.readFileSync('privatekey.pem'),
    pc = fs.readFileSync('certificate.pem');
var opts = {
    key: pk,
    cert: pc
};

var server = https.createServer(opts);

*/


// configure express
//app.set('port', process.env.PORT || 80);
//app.set('port', process.env.SSLPORT || 443);
app.use(express.static(__dirname + '/project'));

//amormaid_bot
var twitter = new Twit({
  consumer_key:         'AClGTCLYhkTpkJ0yUcK5bOXJ0',
  consumer_secret:      'gTuhr97hTaY9MjIZ1ivm8P5VDyb44mf01sM3fMa2F2joNrXXyR',
  access_token:         '4776855367-dPenCEyU4UryxL0OFHiqn2VtpEj1mGAJnUZQmL0',
  access_token_secret:  'GHx8nNvDImkjhanzWLBhGQ4GdhDEACjoXguG1Yr3MJRN1',
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
});

var stream;
let  settimeout_id;
/*
function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}
*/
function io_socket(socket) {
    var tweetPayload = [];
    // stream  turn on  and  turn off  at  61 seconds later
    if(!tweet_stream_staus){
        stream = twitter.stream('statuses/filter', { locations: [ '-180','-90','180','90' ] });
        tweet_stream_staus = true;
        console.log("stream open !");

    }
    clearTimeout(settimeout_id);
    settimeout_id = setTimeout(function(){
        stream.stop();
        tweet_stream_staus = false;
        console.log("stream stop !");
        socket.emit('tweets_response',tweetPayload);
    },61000);
    
	socket.on('tweets_request',function () {
		stream.on('tweet', function (tweet) {
		
			if(tweetPayload.length > 19 ) {
				//socket.on('tweets_request', function (data) {
					socket.emit('tweets_response',tweetPayload);
					console.log(tweetPayload.length,'  tweets  send !');
					tweetPayload = [];
				//});
			} else if( tweet.geo && tweet.user.lang == 'en') {
					tweetPayload.push(tweet);
					//console.log(tweetPayload.length);
				
			}
		});		
		
		stream.on('disconnect', function (disconnectMessage) {
			stream.stop();
			console.log("disconnected ,so stream stop ~");
			socket.emit('tweets_response',tweetPayload);
		});
	});
}

io.on('connection', io_socket);
ios.on('connection', io_socket);

io.on('disconnect',function(){
    stream.stop();
    tweet_stream_staus = false;
    console.log("stream stop !");
	console.log('socket disconnect ;');
});
ios.on('disconnect',function(){
    stream.stop();
    tweet_stream_staus = false;
    console.log("stream stop !");
	console.log('socket disconnect;');
});
// START SERVER
//server.listen(80);
//console.log('listening on port', app.get('port'));
