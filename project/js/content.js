define(function (require) {
	"use strict";
	/*
	const options = {
		hostname: 'localhost',
		port: 443,
		path: '/',
		method: 'post',
		key: fs.readFileSync('privatekey.pem'),
		cert: fs.readFileSync('certificate.pem'),
		rejectUnhauthorized: false,
		agent: false // 从连接池中指定挑选一个当前连接状态为关闭的https.Agent
	},
	req = https.request(options);
	*/
	//require 
	const topojson = require('topojson');
	const d3 = require('d3');
	const io = require('socket');
	const jQuery = require('jquery');

	// HTML element
	//console.log("enter content !");
	//document.documentElement.style.overflowY = 'hidden';
	var width = $('.twitter-tour-canvas').width();
	var height = $('.twitter-tour-canvas').height();
	var $textSection = $('#text-section');
	var $mediaimage = $('#media-image');
	var $avatar = $('#avatar');

	//speech variables
	var speech, final_transcript, velocity_index = 1;

	//D3  Geo variables
	var projection, path, λ, φ, canvas, context, sphere, graticule, grid, land, countries, borders, angle, rotate;
	var start = false;
	var curCoordinates = [];
	var index = 0;
	var diameter = parseInt(height),
		radius = diameter >> 1,
		velocity = 0.005 * velocity_index,
		then = Date.now(),
		angle_cache = 0;
	var circle = d3.geo.circle();
	var curLong;
	//tweets variables
	var tweetStats = [];
	var tweetImgStats = [];
	var textBeginx = Math.round(width * 0.7),
		textBeginy = 0,
		textEndx = Math.round(width * 0.96),
		textEndy = Math.round(height * 0.96);
	var maxWidth = Math.round(width * 0.26),
		lineHeight = 30,
		textMetrics,
		textHeight,
		FONT_HEIGHT = 128;

	//    D3  Geo initialize
	projection = d3.geo.orthographic().scale(radius - 2)
		.translate([parseInt(width * 0.35), parseInt(height / 2)]).clipAngle(90);
	path = d3.geo.path().projection(projection);
	λ = d3.scale.linear().domain([0, width]).range([-180, 180]);
	canvas = d3.select(".twitter-tour-canvas")
		.append("canvas")
		.attr("class", "canvas")
		.attr("width", width)
		.attr("height", height);
	context = canvas.node().getContext("2d");

	//  depict
	d3.json("data/world-110m.json", function (error, world) {
		sphere = { type: "Sphere" };
		graticule = d3.geo.graticule();
		grid = graticule();
		land = topojson.feature(world, world.objects.land),
			countries = topojson.feature(world, world.objects.countries).features,
			borders = topojson.mesh(world, world.objects.countries, function (a, b) { return a !== b; });

		//  rotate
		d3.timer(function () {

			//angle = velocity * (Date.now() - then);
			angle = angle_cache + 0.005 * velocity_index * (Date.now() - then);
			then = Date.now();
			angle_cache = angle;

			rotate = [0, 0, 0];
			rotate[0] = angle;
			projection.rotate(rotate);

			context.clearRect(0, 0, width, height);

			//globe
			path(sphere);
			context.lineWidth = 1;
			context.strokeStyle = "#000";
			context.stroke();
			context.fillStyle = "#fff";
			context.fill();
			//project the back of the globe
			projection.clipAngle(180);
			context.beginPath();
			path(land);
			context.fillStyle = "#dadac4";
			context.fill();
			//project the front of the globe
			projection.clipAngle(90);
			context.beginPath();
			path(grid);
			context.lineWidth = .5;
			context.strokeStyle = "rgba(119,119,119,.5)";
			context.stroke();
			//land
			context.beginPath();
			path.context(context)(land);
			context.fillStyle = "#434338";
			context.fill();
			context.lineWidth = .5;
			context.strokeStyle = "#000";
			context.stroke();
			//border
			context.beginPath();
			path(borders);
			context.strokeStyle = "#fff";
			context.lineWidth = .5;
			context.stroke();
			//twinkle
			if (angle % 360 < 180) {
				curLong = -angle % 360;
			} else {
				curLong = 360 - (angle % 360);
			}
			if (start && (curCoordinates[0] < curLong + 75)) {
				context.save();
				context.beginPath();
				path(circle.origin(curCoordinates).angle(0.9)());
				context.fillStyle = '#FF0000';
				context.fill();
				context.lineWidth = '25';
				context.strokeStyle = 'rgba(255,' + Math.round(255 * Math.cos(angle)) + ',' + Math.round(255 * Math.cos(angle)) + ', 0.4)';
				context.stroke();
				context.restore();
			}
		});
	});



	function renderData() {
		$avatar.attr('src', "");
		$avatar.hide();
		$textSection.hide();
		$mediaimage.attr('src', '');
		$mediaimage.css('display', 'none');

		try {
			if (tweetStats.length > 0) {
				console.log('we have ' + tweetStats.length + ' tweets !');
				var dataToRender;
				//select right tweet
				if (tweetStats && tweetStats.length > 0) {
					for (var i = 0; i < tweetStats.length; i++) {
						var curangle;

						if (angle % 360 < 180) {
							curangle = -angle % 360;
						} else {
							curangle = 360 - (angle % 360);
						}

						var longitude = tweetStats[i].coordinates.coordinates[0];

						if (longitude < curangle + 90 && longitude > curangle - 90 && (tweetStats[i].user)) {
							dataToRender = tweetStats[i];
							tweetStats.splice(i, 1);
							start = true;
							break;
						} else {
							start = false;
						}
					}
				}

				var tweetlink = 'https://twitter.com/' + dataToRender.user.screen_name + '/status/' + dataToRender.id_str;
				//longitude latitude
				curCoordinates = [dataToRender.coordinates.coordinates[0], dataToRender.coordinates.coordinates[1]];
				var tweet_text = dataToRender.text.replace(/(\b(http|https)+\S*\b)*/g, '');
				//console.log("curangle is "+(angle%360)+" ,and coordinates is "+curCoordinates);

				//$avatar.attr('src',dataToRender.user.profile_image_url);
				$avatar.attr('src', dataToRender.user.profile_image_url_https);
				$avatar.load(function () {
					$avatar.show();
					$textSection.html("<p>" + tweet_text + "<a href='" + tweetlink + "' target='_blank'> @</a></p>");
					$textSection.show();
				});

				if (dataToRender.entities && dataToRender.entities.media && dataToRender.entities.media.length) {
					if (window.location.protocol == 'http:') {
						$mediaimage.attr('src', dataToRender.entities.media[0]['media_url']);
						//console.log("getting img !");
					} else {
						$mediaimage.attr('src', dataToRender.entities.media[0]['media_url_https']);
						//console.log("getting img !");
					}
					$mediaimage.show(500);
				}
			}
		} catch (err) {
			console.log(err.message);
		}
		setTimeout(renderData, 5000);
	}

	function makeDataRequest_socket() {
		console.log(" a new  socket  request at  " + (new Date()).toString().substring(16, 24));
		/*
		if(window.location.protocol = 'https:'){
			var url = window.location.protocol + '//104.224.166.80:443';
		}else{
			var url = window.location.protocol + '//104.224.166.80:80';
		}
		*/

		//  
		//var url = window.location.href;
		var url = window.location.protocol + "//" + window.location.host;

		var socket = io.connect(url);
		socket.emit('tweets_request', { 'new': 'data_request !' });
		socket.on('tweets_response', function (data) {
			if (data && data.length > 0) {
				console.log("new " + data.length + " tweets get !");
				//tweetStats = data;	
				if (tweetStats.length < 10) {
					for (var j = 0; j < data.length; j++) {
						tweetStats.push(data[j]);
						preload_img(data[j].user.profile_image_url_https);
						if (data[j].entities && data[j].entities.media && data[j].entities.media.length) {
							// preload img      
							preload_img(data[j].user.profile_image_url_https);
							if (window.location.protocol == 'http:') {
								console.log("loading img ");
								preload_img(data[j].entities.media[0]['media_url']);
							} else {
								preload_img(data[j].entities.media[0]['media_url_https']);
							}

						}
					}
				} else {
					for (var k = 0; k < data.length; k++) {
						/*if(/(instagram)+/i.test(data[k])){
							tweetStats.push(data[k]);
						}else  */
						if (data[k].entities && data[k].entities.media && data[k].entities.media.length) {
							tweetStats.push(data[k]);
							// preload img      
							preload_img(data[k].user.profile_image_url_https);
							if (window.location.protocol == 'http:') {
								console.log("loading img ");
								preload_img(data[k].entities.media[0]['media_url']);
							} else {
								preload_img(data[k].entities.media[0]['media_url_https']);
							}

						}
					}
				}
			}
		});
		setTimeout(makeDataRequest_socket, 100000);
	}

	renderData();
	makeDataRequest_socket();


	//  preload img 

	function preload_img(img_url) {

		var newimages = new Image();
		newimages.src = img_url;
		newimages.onload = function () {
			console.log(img_url + " loaded !");
		}
		newimages.onerror = function () {
			console.log(img_url + " load error !");
		}
	}
	// preload img end  






	/*	
		function makeDataRequest_ajax(){
			console.log("        makeDataRequest  ");
			$.ajax({
				method: 'GET',
				//url: window.location.protocol + '//amormaid.tk:8080',
				url: window.location.protocol + '//127.0.0.1:80/tweets',
				contentType: 'application/json',
				success: function(data){
					if( data.length && data.length > 0) {	
					console.log("new "+data.length +" tweets get !");	
						//tweetStats = data;	
						if( tweetStats.length < 10) {	
							for(var j=0;j<data.length;j++){
								tweetStats.push(data[j]);
							}
							data = [];
						}else{
							for(var k=0;k<data.length;k++){
								if( data[k].entities && data[k].entities.media && data[k].entities.media.length ){
									tweetImgStats.push(data[k]);
								}
							}
							data = [];
						}	
					}
				},
				error: function(){
					console.log("makedatarequest error !");
				}
			});
			
			if(tweetStats.length < 50){
				setTimeout(makeDataRequest_ajax,10000);
			}else{
				setTimeout(makeDataRequest_ajax,100000);
			}
		}
	
	*/


	/*
		(function(){
			makeDataRequest();
			setTimeout(renderData,6000);
		})();
	*/
});
