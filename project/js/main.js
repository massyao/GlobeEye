requirejs.config({
	baseUrl: window.location.protocol + "//" + window.location.host + window.location.pathname ,
	paths: {
		js: 'js',
		d3: 'js/d3.min',
		content:'js/content',
		jquery:'js/jquery',
		topojson:'js/topojson',
		socket:'js/socket.io'
	},
	deps: [ 'jquery', 'content','topojson'],
});
