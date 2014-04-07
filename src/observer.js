/**
 * Created with JetBrains PhpStorm.
 * User: newton
 * Date: 13-1-3
 * Time: 上午9:02
 * To change this template use File | Settings | File Templates.
 */
"use strict";
this.observer = {};
observer._util = {};
observer._module = {};

(function (util){
	var AP = Array.prototype;
	var toString = Object.prototype.toString;

	util.isString = function (val){
		return toString.call(val) === '[object String]';
	};

	util.isFunction = function (val){
		return toString.call(val) === '[object Function]';
	};

	util.isArray = Array.isArray || function (val){
		return toString.call(val) === '[object Array]';
	};

	var forEach = util.forEach = function (arr, fn){
		for (var len = arr.length || 0, i = len; i >= 1; --i) {
			if (fn(arr[len - i], len - i, arr) === false) {
				break;
			}
		}
	};

	util.indexOf = AP.indexOf ? function (arr, item){
		return arr.indexOf(item);
	} : function (arr, item){
		var index = -1;

		forEach(arr, function (entries, i){
			if (entries === item) {
				index = i;
				return false;
			}
		});

		return index;
	};

	util.removeItem = function (arr, item){
		forEach(arr, function (entries, i){
			if (entries === item) {
				arr.splice(i, 1);
				return false;
			}
		});
	};
})(observer._util);

(function (util, module, undefined){
	var TOPIC_STACK = {
		length: 0,
		listeners: []
	};
	var TOPIC_RE = /^[A-Z_$][A-Z0-9_$]*(\.[A-Z_$][A-Z0-9_$]*)*$/i;

	function validTopic(topic){
		var valid = util.isString(topic) && TOPIC_RE.test(topic);

		if (valid) {
			return true;
		} else {
			throw SyntaxError('Illegal Topic');
		}
	}

	function setTopic(topic){
		var tns = TOPIC_STACK;

		util.forEach(topic.split('.'), function (topic){
			if (topic === 'listeners' || topic === 'length') {
				return;
			}

			if (!tns[topic]) {
				tns.length += 1;
				tns[topic] = {
					length: 0,
					listeners: []
				};
			}

			tns = tns[topic];
		});

		return tns;
	}

	function getTopic(topic){
		var tns = TOPIC_STACK;

		util.forEach(topic.split('.'), function (topic){
			if (!tns) {
				return false;
			}

			if (topic === 'listeners' || topic === 'length') {
				return;
			}

			tns = tns[topic] || undefined;
		});

		return tns;
	}

	function emptyTopic(tns){
		return (!tns.length && !tns.listeners.length);
	}

	function cleanTopic(topic, cns){
		if (!emptyTopic(cns)) {
			return;
		};

		var lastdot = topic.lastIndexOf('.'),
			pnsstr = topic.substring(0, lastdot),
			cnsstr = topic.substring(lastdot + 1),
			pns = pnsstr ? getTopic(pnsstr) : TOPIC_STACK;

		delete pns[cnsstr];

		pns.length -= 1;

		if (pnsstr) {
			topic = pnsstr;

			for (var i = topic.split('.').length; i >= 1; --i) {
				lastdot = topic.lastIndexOf('.');
				pnsstr = topic.substring(0, lastdot);
				cnsstr = topic.substring(lastdot + 1);
				cns = getTopic(topic);

				if (!emptyTopic(cns)) {
					break;
				}

				pns = pnsstr ? getTopic(pnsstr) : TOPIC_STACK;

				delete pns[cnsstr];

				pns.length -= 1;
				topic = pnsstr;
			}
		}
	}

	function walk(tns, message, topic, publisher){
		util.forEach(tns.listeners, function (fn){
			fn(message, topic, publisher);
		});

		for (var i in tns) {
			if (!tns.hasOwnProperty(i) || i === 'listeners' || i === 'length') {
				continue;
			}

			walk(tns[i], message, topic + '.' + i, publisher);
		}
	}

	function notify(message, topic){
		var tns = getTopic(topic);

		if (!tns) {
			return;
		}

		walk(tns, message, topic, topic);
	}

	module.subscribe = function (topic, fn){
		topic = util.isArray(topic) ? topic : [topic];

		util.forEach(topic, function (topic){
			if (!validTopic(topic)) {
				return;
			}

			var tns = setTopic(topic);
			var listeners = tns.listeners;

			fn = util.isArray(fn) ? fn : [fn];

			util.forEach(fn, function (fn){
				util.isFunction(fn) && util.indexOf(listeners, fn) === -1 && listeners.push(fn);
			});
		});
	};

	module.publish = function (topic, message){
		topic = util.isArray(topic) ? topic : [topic];

		util.forEach(topic, function (topic){
			validTopic(topic) && notify(message, topic);
		});
	};

	module.unsubscribe = function (topic, fn){
		if (!arguments.length) {
			TOPIC_STACK = {
				length: 0,
				listeners: []
			};
		} else {
			topic = util.isArray(topic) ? topic : [topic];

			switch (arguments.length) {
				case 1:
					util.forEach(topic, function (topic){
						if (!validTopic(topic)) {
							return;
						}

						var tns = getTopic(topic);

						if (!tns) {
							return;
						}

						tns.listeners = [];

						cleanTopic(topic, tns);
					});
					break;
				default:
					util.forEach(topic, function (topic){
						if (!validTopic(topic)) {
							return;
						}

						var tns = getTopic(topic);

						if (!tns) {
							return;
						}

						var listeners = tns.listeners;
						fn = util.isArray(fn) ? fn : [fn];

						util.forEach(fn, function (fn){
							util.removeItem(listeners, fn);
						});

						cleanTopic(topic, tns);
					});
					break;
			}
		}
	};
}(observer._util, observer._module));

(function (observer, global){
	global.observer.subscribe = observer._module.subscribe;
	global.observer.publish = observer._module.publish;
	global.observer.unsubscribe = observer._module.unsubscribe;
	delete observer._util;
	delete observer._module;
}(observer, this));
