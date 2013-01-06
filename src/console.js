/**
 * Created with JetBrains PhpStorm.
 * User: newton
 * Date: 13-1-3
 * Time: 上午9:02
 * To change this template use File | Settings | File Templates.
 */
"use strict";
this.console = this.console || {};

(function (console, global){
    var timeStack = {};
	
	global.console.log = console.log || function(){};
	
	global.console.info = console.info || function(){};
				
	global.console.time = global.console.time || function(name){
		timeStack[name] = +new Date();
	};
	
	global.console.timeEnd = global.console.timeEnd || function(name){
		if(timeStack[name]) {
			console.info(name + ': ' + (+new Date() - timeStack[name]) + 'ms');
			delete timeStack[name];
		}
	};
}(console, this));

