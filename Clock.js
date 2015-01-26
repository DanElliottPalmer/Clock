(function( namespace ){

	(function() {
	    var lastTime = 0;
	    var vendors = ['ms', 'moz', 'webkit', 'o'];
	    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
	        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
	        window.cancelAnimationFrame =
	          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	    }

	    if (!window.requestAnimationFrame)
	        window.requestAnimationFrame = function(callback, element) {
	            var currTime = new Date().getTime();
	            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
	            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
	              timeToCall);
	            lastTime = currTime + timeToCall;
	            return id;
	        };

	    if (!window.cancelAnimationFrame)
	        window.cancelAnimationFrame = function(id) {
	            clearTimeout(id);
	        };
	}());

	function ClockManager(){
		var frame = null;
		var self = this;
		this.clocks = [];
		var i = -1;
		var len = 0;
		this._hook = function(){
			frame = requestAnimationFrame( self._hook );
			if( self.clocks.length === 0 ) return;
			i = -1;
			len = self.clocks.length;
			while( ++i < len ){
				self.clocks[ i ]._hook();
			}
		};
		frame = requestAnimationFrame( this._hook );
	}
	ClockManager.prototype = {
		"create": function( config ){
			var clock = new Clock( config );
			return clock;
		},
		"constructor": ClockManager,
		"hook": function( clock ){
			this.clocks.push( clock );
		},
		"unhook": function( clock ){
			var len = this.clocks.length;
			while( len-- ){
				if( this.clocks[ len ] === clock ){
					this.clocks.splice( len, 1 );
					return;
				}
			}
		}
	};
	var ClockManager = namespace.ClockManager = new ClockManager();

	/**
	 * Clock constructor
	 * @param {Object} _config Configuration
	 * @param {Number} _config.interval Interval time for each tick
	 * @param {Date} _config.startTime Date for the clock to start from
	 */
	function Clock( _config ){
		var self = this;
		var config = _config || {};

		/**
		 * These variables we use in the animation frame so rather than constantly
		 * making new ones, we'll use store them here.
		 */
		var now = null;
		var duration = null;
		var delta = 0;
		/**
		 */
		
		// this._frameId = null;
		this._hook = function(){
			// self._frameId = requestAnimationFrame( self._hook );
			now = new Date();
			delta = now.getTime() - self._lastFrame.getTime();
			if( self._interval === null ||
				 	self._interval <= delta ){
				duration = now.getTime() - self._startTime.getTime();
				self._lastFrame = now;
				self.trigger("tick", self._startTime, now, duration, delta);
			}	
		};
		this._interval = config.interval >>> 0 || null;
		this._lastFrame = config.startTime || null;
		this._listeners = {};
		this._startTime = config.startTime || null;
		this.timezoneOffset = (new Date()).getTimezoneOffset();
	}
	Clock.prototype = {

		"constructor": Clock,

		/**
		 * Removes events from the clock
		 * @param  {String} type    
		 * @param  {Function} handler 
		 */
		"off": function( type, handler ){
			if( !this._listeners.hasOwnProperty( type ) ||
					this._listeners[ type ].length === 0 ) return;
			var handlers = this._listeners[ type ];
			var len = handlers.length;
			while( len-- ){
				if( handlers[ len ] === handler ){
					handlers.splice( len, 1 );
					return;
				}
			}
		},

		/**
		 * Adds events to the clock
		 * @param  {String} type    
		 * @param  {Function} handler 
		 */
		"on": function( type, handler ){
			if( !this._listeners.hasOwnProperty( type ) ){
				this._listeners[ type ] = [];
			}
			this._listeners[ type ].push( handler );
		},

		/**
		 * Starts the clock ticking
		 */
		"start": function(){
			if( this._startTime === null ){
				this._startTime = this._lastFrame = new Date();
			}
			ClockManager.hook( this );
			// this._frameId = requestAnimationFrame( this._hook );
		},

		/**
		 * Stops the clock ticking
		 */
		"stop": function(){
			// cancelAnimationFrame( this._frameId );
			// this._frameId = null;
			ClockManager.unhook( this );
			this._lastFrame = null;
			this._startTime = null;
		},

		/**
		 * Triggers events from the clock
		 * @param  {String} type
		 * @param  {*} [data]
		 */
		"trigger": function( type /*, data */ ){
			if( !this._listeners.hasOwnProperty( type ) ||
					this._listeners[ type ].length === 0 ) return;
			var data = [];
			var i = 0;
			var len = arguments.length;
			while( ++i < len ){
				data.push( arguments[i] );
			}
			i = -1;
			len = this._listeners[ type ].length;
			while( ++i < len ){
				this._listeners[ type ][ i ].apply( this, data );
			}
		}
	};

	namespace.Clock = Clock;

})( window );