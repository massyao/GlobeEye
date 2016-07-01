define(function(require){
	"use strict";

	var topojson = require('topojson.v1');
	var d3 = require('d3');

	require('jquery');

	console.log("enter twitter-tour.js !");
	
	var width           = $('.twitter-tour-canvas').width();
	var height          = $('.twitter-tour-canvas').height();
	var $textSection    = $('#text-section');
	var $mediaimage    = $('#media-image');
	var $avatar        = $('#avatar');

	var projection
		, path
		, λ
		, φ
		, canvas
		,context
		,sphere
		,graticule
		,grid
		,land
		,countries
		,borders
		,angle
		,rotate;
	var start           = false;
	var tweetStats      = [];
	var tweetImgStats   = [];
	var curCoordinates  = [];
	var index            = 0;
	
	
	var textBeginx = Math.round(width*0.7),
		textBeginy = 0,
		textEndx = Math.round(width*0.96),
		textEndy = Math.round(height*0.96);
		
	var maxWidth = Math.round(width*0.26),
		lineHeight = 30,
		textMetrics,
		textHeight,
		FONT_HEIGHT = 128;
		
		

	(function createProjection(){
		console.log("function createProjection work !");
	
		var diameter = parseInt(height),
			radius = diameter>> 1,
			velocity = .005,
			then = Date.now();
		var circle = d3.geo.circle(); 

		projection = d3.geo.orthographic()
							.scale(radius-2)
							.translate([parseInt(width*0.35), parseInt(height / 2)])
							.clipAngle(90);
		path = d3.geo.path()
			.projection(projection);
		λ = d3.scale.linear()
			.domain([0, width])
			.range([-180, 180]);

		canvas = d3.select(".twitter-tour-canvas")
				.append("canvas")
				.attr("class", "canvas")
				.attr("width", width)
				.attr("height", height);

		context = canvas.node().getContext("2d");


		d3.json("public/data/world-110m.json", function(error, world) {
		
			//if (error) throw error;
			
			sphere = {type: "Sphere"};
			graticule = d3.geo.graticule();
			grid = graticule();
			land = topojson.feature(world, world.objects.land),
			countries = topojson.feature(world, world.objects.countries).features,
			borders = topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; });

			if(/chrom(e|ium)/.test(navigator.userAgent.toLowerCase())){
			//	pulse();
			}
			


			d3.timer(function() {
				angle = velocity * (Date.now() - then);
				rotate = [0, 0, 0]; 
				rotate[0] = angle;
				projection.rotate(rotate);
				
				context.clearRect(0, 0, width, height);
				
				//globe
				(function(){
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
				})();
				
				//twinkle
				(function(){
				
						var curLong;
			
						//cords range(curangle+80,curangle-80) 
						if(angle % 360 <180){
							curLong = -angle % 360;
						}else{
							curLong = 360 - (angle % 360);
						}
					//if((tweetStats.length !== 0) && (angle%360 < 80) || (angle%360 > 280 && angle%360 < 360)){
					if(start && (curCoordinates[0] < curLong+75)){
						context.save();
						context.beginPath();
						path(circle.origin(curCoordinates).angle(0.9)());
						context.fillStyle = '#FF0000';
						context.fill();
						context.lineWidth = '25';
						context.strokeStyle = 'rgba(255,'+Math.round(255*Math.cos(angle))+','+Math.round(255*Math.cos(angle))+', 0.4)';
						context.stroke();
						context.restore();
						
						
					}
				})();
					
				
			});		
			
		});		
	})();

		
	function renderData(){
		
		console.log("                             renderData  ");
		$avatar.attr('src',"");
		$avatar.hide();
		$textSection.hide();
		
		if($mediaimage){
			
			$mediaimage.attr('src','');
		}
		
		//if( index !== 0 && !index ) return false;
		//if( index !== 0 && !index ) index = 0;
		if(tweetStats.length > 0){
			
			var dataToRender;
			//select right tweet
			(function(){
				if(tweetStats && tweetStats.length >0){
					for(var i=0;i<tweetStats.length;i++){
						var curangle;
						
						//cords range(curangle+80,curangle-80) 
						if(angle % 360 <180){
							curangle = -angle % 360;
						}else{
							curangle = 360 - (angle % 360);
						}
						
						
						var longitude = tweetStats[i].coordinates.coordinates[0];
						
						if(longitude < curangle+90 &&  longitude > curangle-90 && (tweetStats[i].user) ) {
							dataToRender = tweetStats[i];
							
							tweetStats.splice(i,1); 
							start = true ;
							break;
						}else{
							start = false ;
						}
						
						
					}
				}
				
				if(!dataToRender){
					console.log("tweet dataToRender error !");
					setTimeout(renderData,5000);
					return;
				}
				
				if(tweetImgStats && tweetImgStats.length >0){
					for(var m=0;m<tweetImgStats.length;m++){
						tweetStats.push(tweetImgStats[m]);
					}
					tweetImgStats = [];
				}
			})();	 
			
			console.log(tweetStats.length +"  tweets left !");
			
			
			(function(){
				var tweetlink = 'https://twitter.com/'+ dataToRender.user.screen_name +'/status/'+ dataToRender.id_str;
				//longitude latitude
				curCoordinates = [dataToRender.coordinates.coordinates[0],dataToRender.coordinates.coordinates[1]];
				//dataToRender.coordinates.coordinates is [longitude,latitude]
				
				console.log("curangle is "+(angle%360)+" ,and coordinates is "+curCoordinates);
				
		
				
				$avatar.attr('src',dataToRender.user.profile_image_url);
				
				$avatar.load(function(){
					$avatar.show();	
					$textSection.html("<p>" + dataToRender.text + "<a href='" + tweetlink + "'> @</a></p>");
					$textSection.show();
				});
			})();		
			
			if( dataToRender.entities && dataToRender.entities.media && dataToRender.entities.media.length ){
				
				if( window.location.protocol == 'http:'){
					$mediaimage.attr('src',dataToRender.entities.media[0]['media_url']);
					console.log("getting img !");
				} else {
					$mediaimage.attr('src',dataToRender.entities.media[0]['media_url_https']);
					console.log("getting img !");
					//dataToRender.entities.media[0]['media_url_https']
				}
				$mediaimage.show();	
			}	
		}	
		setTimeout(renderData,5000);
	}	
		
		




/*
	function loop( first ){
		console.log("function loop work !");
		setTimeout(function(){
			if( tweetStats.length ){
				$cover.hide();
				$mediaimage.hide();
				$textSection.fadeOut(800);
				$textLoc.fadeOut(800);
				pulseCircle
					.attr('opacity',0);
				userCircle.transition()
					.duration(800)
					.attr('opacity',0)
					.each("end", function(){
///////////////////			switchLocation( curIndex );
						curIndex++;
						loop();
					});
			}
		}, first ? 0 : 10000);
	}

*/	
	
	function makeDataRequest(){
		console.log("        makeDataRequest  ");
		$.ajax({
			method: 'GET',
			url: window.location.protocol + '//amormaid.tk:8080',
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
			setTimeout(makeDataRequest,10000);
		}else{
			setTimeout(makeDataRequest,100000);
		}
	}

	(function(){
		makeDataRequest();
		setTimeout(renderData,6000);
	})();
	
});