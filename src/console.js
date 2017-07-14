'use strict';

this.console = this.console || {};

(function(console, global) {
  var timeStack = {};

  global.console.log = console.log || function() {};

  global.console.info = console.info || function() {};

  global.console.time = console.time || function(name) {
    timeStack[name] = +new Date();
  };

  global.console.timeEnd = console.timeEnd || function(name) {
    if (timeStack[name]) {
      console.info(name + ': ' + (+new Date() - timeStack[name]) + 'ms');
      delete timeStack[name];
    }
  };
}(console, this));
