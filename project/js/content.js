define(function(require){
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
	const  topojson = require('topojson');
	const  d3          = require('d3');
	const  io           = require('socket');
	const  jQuery    = require('jquery');

	// HTML element
	//console.log("enter content !");
	//document.documentElement.style.overflowY = 'hidden';
	var width               = $('.twitter-tour-canvas').width();
	var height              = $('.twitter-tour-canvas').height();
	var $textSection     = $('#text-section');
	var $mediaimage   = $('#media-image');
	var $avatar             = $('#avatar');
	
	//speech variables
	var   speech, final_transcript ,velocity_index = 1;
	
	//D3  Geo variables
	var projection, path, λ, φ, canvas,context,sphere,graticule,grid,land,countries,borders,angle,rotate;
	var start                   = false;
	var curCoordinates   = [];
	var index                  = 0;
	var diameter = parseInt(height),
		radius = diameter>> 1,
		velocity = 0.005*velocity_index,
		then = Date.now(),
		angle_cache = 0;
	var circle = d3.geo.circle(); 
	var curLong;
	//tweets variables
	var tweetStats          = [];
	var tweetImgStats    = [];
	var textBeginx = Math.round(width*0.7),
		textBeginy = 0,
		textEndx = Math.round(width*0.96),
		textEndy = Math.round(height*0.96);
	var maxWidth = Math.round(width*0.26),
		lineHeight = 30,
		textMetrics,
		textHeight,
		FONT_HEIGHT = 128;	

	//    D3  Geo initialize
	projection = d3.geo.orthographic().scale(radius-2)
							.translate([parseInt(width*0.35), parseInt(height / 2)]).clipAngle(90);
	path         = d3.geo.path().projection(projection);
	λ              =  d3.scale.linear().domain([0, width]).range([-180, 180]);
	canvas     =  d3.select(".twitter-tour-canvas")
							.append("canvas")
							.attr("class", "canvas")
							.attr("width", width)
							.attr("height", height);
	context    = canvas.node().getContext("2d");
//////////////////////////////////////////////
/////////// star back ground//////////////
/////////////////////////////////////////////
/*
	var   w =width ,
	  h = height ,
	  hue = 217,
	  stars = [],
	  count = 0,
	  maxStars = 1200;

	var canvas2 = document.createElement('canvas'),
	  ctx2 = canvas2.getContext('2d');
	canvas2.width = 100;
	canvas2.height = 100;
	var half = canvas2.width / 2,
	  gradient2 = ctx2.createRadialGradient(half, half, 0, half, half, half);
	gradient2.addColorStop(0.025, '#fff');
	gradient2.addColorStop(0.1, 'hsl(' + hue + ', 61%, 33%)');
	gradient2.addColorStop(0.25, 'hsl(' + hue + ', 64%, 6%)');
	gradient2.addColorStop(1, 'transparent');

	ctx2.fillStyle = gradient2;
	ctx2.beginPath();
	ctx2.arc(half, half, half, 0, Math.PI * 2);
	ctx2.fill();

	// End cache

	function random(min, max) {
	  if (arguments.length < 2) {
		max = min;
		min = 0;
	  }

	  if (min > max) {
		var hold = max;
		max = min;
		min = hold;
	  }

	  return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	function maxOrbit(x, y) {
	  var max = Math.max(x, y),
		diameter = Math.round(Math.sqrt(max * max + max * max));
	  return diameter / 2;
	}

	var Star = function() {

	  this.orbitRadius = random(maxOrbit(w, h));
	  this.radius = random(60, this.orbitRadius) / 12;
	  this.orbitX = w / 2;
	  this.orbitY = h / 2;
	  this.timePassed = random(0, maxStars);
	  this.speed = random(this.orbitRadius) / 900000;
	  this.alpha = random(2, 10) / 10;

	  count++;
	  stars[count] = this;
	}

	Star.prototype.draw = function() {
	  var x = Math.sin(this.timePassed) * this.orbitRadius + this.orbitX,
		y = Math.cos(this.timePassed) * this.orbitRadius + this.orbitY,
		twinkle = random(10);

	  if (twinkle === 1 && this.alpha > 0) {
		this.alpha -= 0.05;
	  } else if (twinkle === 2 && this.alpha < 1) {
		this.alpha += 0.05;
	  }

	  context.globalAlpha = this.alpha;
	  context.drawImage(canvas2, x - this.radius / 2, y - this.radius / 2, this.radius, this.radius);
	  this.timePassed += this.speed;
	}

	for (var i = 0; i < maxStars; i++) {
	  new Star();
	}

	function animation() {
	  context.globalCompositeOperation = 'source-over';
	  context.globalAlpha = 0.8;
	  context.fillStyle = 'hsla(' + hue + ', 64%, 6%, 1)';
	  context.fillRect(0, 0, w, h)

	  context.globalCompositeOperation = 'lighter';
	  for (var i = 1, l = stars.length; i < l; i++) {
		stars[i].draw();
	  };

	  window.requestAnimationFrame(animation);
	}
animation();
*/	

///////////////////////////////////////////
//////////star back ground/end ///////
//////////////////////////////////////////
	//  depict
	d3.json("data/world-110m.json", function(error, world) {
		sphere = {type: "Sphere"};
		graticule = d3.geo.graticule();
		grid = graticule();
		land = topojson.feature(world, world.objects.land),
		countries = topojson.feature(world, world.objects.countries).features,
		borders = topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; });

		//  rotate
		d3.timer(function() {
            
			//angle = velocity * (Date.now() - then);
			angle = angle_cache + 0.005*velocity_index * (Date.now() - then);
			then = Date.now();
			angle_cache = angle ;
			
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
			if(angle % 360 <180){
				curLong = -angle % 360;
			}else{
				curLong = 360 - (angle % 360);
			}
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
		});		
	});		


		
	function renderData(){
		$avatar.attr('src',"");
		$avatar.hide();
		$textSection.hide();
		$mediaimage.attr('src','');
		$mediaimage.css('display','none');
	
		try{
			if(tweetStats.length > 0){
				console.log('we have '+tweetStats.length+' tweets !');
				var dataToRender;
				//select right tweet
				if(tweetStats && tweetStats.length >0){
					for(var i=0;i<tweetStats.length;i++){
						var curangle;
						
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
				
				var tweetlink = 'https://twitter.com/'+ dataToRender.user.screen_name +'/status/'+ dataToRender.id_str;
				//longitude latitude
				curCoordinates = [dataToRender.coordinates.coordinates[0],dataToRender.coordinates.coordinates[1]];
				var  tweet_text = dataToRender.text.replace(/(\b(http|https)+\S*\b)*/g,'');
				//console.log("curangle is "+(angle%360)+" ,and coordinates is "+curCoordinates);
		
				//$avatar.attr('src',dataToRender.user.profile_image_url);
				$avatar.attr('src',dataToRender.user.profile_image_url_https);
				$avatar.load(function(){
					$avatar.show();	
					$textSection.html("<p>" + tweet_text + "<a href='" + tweetlink + "' target='_blank'> @</a></p>");
					$textSection.show();
				});
				
				if( dataToRender.entities && dataToRender.entities.media && dataToRender.entities.media.length ){
					if( window.location.protocol == 'http:'){
						$mediaimage.attr('src',dataToRender.entities.media[0]['media_url']);
						//console.log("getting img !");
					} else {
						$mediaimage.attr('src',dataToRender.entities.media[0]['media_url_https']);
						//console.log("getting img !");
					}
					$mediaimage.show(500);	
				}	
			}	
		}catch(err){
			console.log(err.message);
		}
		setTimeout(renderData,5000);
	}	

	function makeDataRequest_socket(){
		console.log(" a new  socket  request at  "+(new Date()).toString().substring(16,24));
		/*
		if(window.location.protocol = 'https:'){
			var url = window.location.protocol + '//104.224.166.80:443';
		}else{
			var url = window.location.protocol + '//104.224.166.80:80';
		}
		*/
        
        //  
		//var url = window.location.href;
        var url = window.location.protocol +"//"+ window.location.host;

		var socket = io.connect(url);
		socket.emit('tweets_request', { 'new': 'data_request !' });
		socket.on('tweets_response',function(data){
			if( data && data.length > 0) {	
				console.log("new "+data.length +" tweets get !");	
				//tweetStats = data;	
				if( tweetStats.length < 10) {	
					for(var j=0;j<data.length;j++){
						tweetStats.push(data[j]);
                        preload_img(data[j].user.profile_image_url_https);
						if( data[j].entities && data[j].entities.media && data[j].entities.media.length ){
                            // preload img      
                            preload_img(data[j].user.profile_image_url_https);
                            if( window.location.protocol == 'http:'){
                                console.log("loading img ");
                                preload_img(data[j].entities.media[0]['media_url']);
                            } else {
                                preload_img(data[j].entities.media[0]['media_url_https']);
                            }
                            
						}
					}
				}else{
					for(var k=0;k<data.length;k++){
						/*if(/(instagram)+/i.test(data[k])){
							tweetStats.push(data[k]);
						}else  */
						if( data[k].entities && data[k].entities.media && data[k].entities.media.length ){
							tweetStats.push(data[k]);
                            // preload img      
                            preload_img(data[k].user.profile_image_url_https);
                            if( window.location.protocol == 'http:'){
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
		setTimeout(makeDataRequest_socket,100000);
	}
	
	renderData();
	makeDataRequest_socket();
    

//  preload img 

function preload_img(img_url){
    
    var newimages=new Image();
    newimages.src=img_url;
    newimages.onload=function(){
        console.log(img_url+" loaded !");
    }
    newimages.onerror=function(){
        console.log(img_url+" load error !");
    }
}
// preload img end  
    
    
    
    
    
/////////////////////////////////////////
//  speech interface
////////////////////////////////////////

//    velocity_index
//   velocity = .005



if ('webkitSpeechRecognition' in window) {
	//var timeout , result;
	var  last_time_stamp = Date.now();
	var  threshold = 2000;
	
	function speech_recognition_initialize() {
	  speech = new webkitSpeechRecognition();
	  speech.continuous = true;
	  speech.maxAlternatives = 5;
	  speech.interimResults = true;
	  speech.lang =  "cmn-Hans-CN";
	  speech.start();
	  //    speech.stop();
	}
	   
	speech_recognition_initialize();

	speech.onresult = function(e) {
		
		if (typeof(e.results) == 'undefined') {
			return;
		}
		//console.log(e);
		for (var i = e.resultIndex; i < e.results.length; ++i) {
			var val = e.results[i][0].transcript;
			//console.log(val);	
			if ( e.results[i].isFinal ) {
				final_transcript =   val;
				console.log(val);

			} 
		}
		if(final_transcript){
/*			
			if (timeout) {
				clearTimeout(timeout);
			}
			timeout = setTimeout(change_velocity_index, 500);
*/
			
			if(Date.now() - last_time_stamp  > threshold){
				change_velocity_index();
				last_time_stamp = Date.now();
			}
			
			//if(voice_interface_keywords.some(function(item, index, arr){})){}
			function change_velocity_index(){
				if((/快+/).test(final_transcript)){
					console.log("快");
					velocity_index *= 2;
				}else if((/慢|卖+/).test(final_transcript)){
					console.log("慢");
					velocity_index /= 2;
				}else if((/停|请+/).test(final_transcript)){
					console.log("停");
					velocity_index = 0;
				}else if((/(倒|反|返)+/).test(final_transcript)){
					console.log("反");
					velocity_index = velocity_index ? velocity_index*(-1) : -1;
				}else if((/(常|正)+/).test(final_transcript)){
					console.log("正常");
					velocity_index = 1;
				}
			}
				
			
		}
		//console.log(final_transcript);
		//console.log(interim_transcript);

	};

	speech.onerror = function(e) {
		var msg = e.error + " error";
		if (e.error === 'no-speech') {
			msg =  "No microphone  detected ";
		} else if (e.error === 'audio-capture') {
			msg =  "Please ensure your microphone is connected ";
		} else if (e.error === 'not-allowed') {
			msg = " Please allow Microphone access ";
		}
		console.log(e.error);
		console.log(msg);
	};

} 







	function  debounce(func, wait, immediate) {
			var timeout, result;

			var later = function (context, args) {
				timeout = null;
				if (args) result = func.apply(context, args);
			};

			var debounced = restArgs(function (args) {
				// 一旦存在timeout， 意味之前尝试调用过func
				// 由于debounce只认最新的一次调用， 所以之前等待执行的func都会被终止
				if (timeout) clearTimeout(timeout);
				// 如果允许新的调用尝试立即执行，
				if (immediate) {
					// 如果之前尚没有调用尝试，那么此次调用可以立马执行，否则一定得等待之前的执行完毕
					var callNow = !timeout;
					// 刷新timeout
					timeout = setTimeout(later, wait);
					// 如果能被立即执行，立即执行
					if (callNow) result = func.apply(this, args);
				} else {
					// 否则，这次尝试调用会延时wait个时间
					timeout = delay(later, wait, this, args);
				}
				return result;
			});
			debounced.cancel = function () {
				clearTimeout(timeout);
				timeout = null;
			};
			return debounced;
	};

	function  throttle (func, wait, options) {

        var timeout, context, args, result;
        // 最近一次func被调用的时间点
        var previous = 0;
        if (!options) options = {};

        // 创建一个延后执行的函数包裹住func的执行过程
        var later = function () {
            // 执行时，刷新最近一次调用时间
            previous = options.leading === false ? 0 : new Date();
            // 清空定时器
            timeout = null;
            result = func.apply(context, args);
            if (!timeout) context = args = null;
        };

        // 返回一个throttled的函数
        var throttled = function () {
            // ----- 节流函数开始执行----
            // 我们尝试调用func时，会首先记录当前时间戳
            var now = new Date();
            // 是否是第一次调用
            if (!previous && options.leading === false) previous = now;
            // func还要等待多久才能被调用 =  预设的最小等待期-（当前时间-上一次调用的时间）
            // 显然，如果第一次调用，且未设置options.leading = false，那么remaing=0，func会被立即执行
            var remaining = wait - (now - previous);
            // 记录之后执行时需要的上下文和参数
            context = this;
            args = arguments;

            // 如果计算后能被立即执行
            if (remaining <= 0 || remaining > wait) {
                // 清除之前的“最新调用”
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                // 刷新最近一次func调用的时间点
                previous = now;
                // 执行func调用
                result = func.apply(context, args);
                // 如果timeout被清空了，
                if (!timeout) context = args = null;

            } else if (!timeout && options.trailing !== false) {
                // 如果设置了trailing edge，那么暂缓此次调用尝试的执行
                timeout = setTimeout(later, remaining);
            }
            return result;
        };

        // 可以取消函数的节流化
        throttled.cancel = function () {
            clearTimeout(timeout);
            previous = 0;
            timeout = context = args = null;
        };

        return throttled;
    };





/////////////////////////////////////////
//  speech interface  end
////////////////////////////////////////

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
