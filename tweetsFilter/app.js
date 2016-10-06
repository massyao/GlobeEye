
'use strict';
var Twit = require('twit');
var express = require('express');
var cors = require('cors');
var fs = require('fs');
//var io = require('socket.io');


var twitter = new Twit({
  consumer_key:         'AClGTCLYhkTpkJ0yUcK5bOXJ0',
  consumer_secret:      'gTuhr97hTaY9MjIZ1ivm8P5VDyb44mf01sM3fMa2F2joNrXXyR',
  access_token:         '4776855367-dPenCEyU4UryxL0OFHiqn2VtpEj1mGAJnUZQmL0',
  access_token_secret:  'GHx8nNvDImkjhanzWLBhGQ4GdhDEACjoXguG1Yr3MJRN1',
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
});
//amormaid_bot


var app = express();

// configure express
app.set('port', process.env.PORT || 8080);
app.use(express.compress());
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded());
app.use(express.json());
app.use(express.methodOverride());
app.use(cors());
app.use(app.router);

// index page
app.get('/', function(req, res) {
	var stream = twitter.stream('statuses/filter', { locations: [ '-180','-90','180','90' ] });
	var tweetPayload = [];
	var resSent;
	res.setHeader( 'content-type', 'application/json' );

	stream.on('tweet', function (tweet) {
		if( tweetPayload.length > 20 ) {
			if( !resSent ){
				resSent = true;
				stream.stop();
				res.send( tweetPayload );
			}
		} else {
			//Constraining tweets to english language
			if( tweet.geo && tweet.user.lang == 'en') {
				tweetPayload.push(tweet);
				console.log(tweetPayload.length);
			}
		}
	});

	stream.on('disconnect', function (disconnectMessage) {
		resSent = true;
		stream.stop();
		res.send( tweetPayload );
	});

	//Handling a twitter stream cutoff situation
	setTimeout(function(){
		if( !resSent ){
			resSent = true;
			stream.stop();
			res.send( tweetPayload );
		}
	},5000);
});

// START SERVER
var server = app.listen(app.get('port'), function() {
	console.log('listening on port', app.get('port'));
});
