requirejs.config({
	//baseUrl: 'file:///Users/dwaltz/projects/geo-tweet-visual/public/vendor',
	baseUrl: window.location.protocol + "//" + window.location.host + window.location.pathname +'public/vendor',
	paths: {
		// APP PATHS
		js: '../js',
		bootstrap: 'bootstrap/bootstrap.min',
		d3: 'd3.min'

	},
	deps: [ 'jquery', 'bootstrap', 'underscore', 'js/twitter-tour'],
	shim: {
		'bootstrap': {
			deps: [ 'jquery' ]
		}
	}
});
