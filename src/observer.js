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
    var toString = Object.prototype.toString;
    var AP = Array.prototype;
	
	util.isString = function(val) {
		return toString.call(val) === '[object String]';
	};

    util.isFunction = function (val){
        return toString.call(val) === '[object Function]';
    };

    util.isArray = Array.isArray || function (val){
        return toString.call(val) === '[object Array]';
    };

    var forEach = util.forEach = function (arr, fn){
        for (var len = arr.length >>> 0, i = len; i >= 1; --i) {
            if(fn(arr[len - i], len - i, arr) === false) break;
        }
    };
	
	util.indexOf = AP.indexOf ? function (arr, item){
		return arr.indexOf(item);
	} : function (arr, item){;
		var index = -1;
		forEach(arr, function(entries, i){
			if(entries === item){
				index = i;
				return false;
			}
		});
		return index;
	};

    util.remove = function (arr, item){
		forEach(arr, function(entries, i){
			if(entries === item){
				arr.splice(i, 1);
				return false;
			}
		});
    };
	
	util.empty = function(o){
		if(Object.keys) return Object.keys(o).length ? false : true;
		for(var i in o){
			return false;
		}		
		return true;
	};
})(observer._util);

(function (util, module){
    var TOPIC_STACK = {};
    var TOPIC_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/igm;

    var testTopic = function (topic){
        TOPIC_RE.lastIndex = 0;
        return util.isString(topic) && TOPIC_RE.test(topic);
    };

    var setTopic = function (topic){
        var ns = TOPIC_STACK;
        util.forEach(topic.split('.'), function (topic){
            if (topic === '__listeners__') return;
            ns[topic] = ns[topic] || {};
            ns = ns[topic];
        });
        return ns;
    };

    var getTopic = function (topic){
        var ns = TOPIC_STACK;
        util.forEach(topic.split('.'), function (topic){
            if (!ns || topic === '__listeners__') return;
            ns = ns[topic] ? ns[topic] : undefined;
        });
        return ns;
    };

    var cleanTopic = function (topic){
		var pns, tnsstr, pnsstr, nsarr = topic.split('.');
		for(var i = nsarr.length >>> 0; i >= 1; --i){
            if (!util.empty(getTopic(topic))) break;
			tnsstr = nsarr.pop();
            pnsstr = nsarr.join('.');
			pns = pnsstr ? getTopic(pnsstr): TOPIC_STACK;
			delete pns[tnsstr];
            topic = pnsstr;
		}
    };
	
	var update = function(ns, message, topic, publisher){
		util.forEach(ns['__listeners__'] || [], function (fn){
            fn(message, topic, publisher);
        });
		for (var i in ns) {
			if (i === '__listeners__') continue;
			update(ns[i], message, topic + '.' + i, publisher);
		}
	};  

    var notify = function (message, topic){
        var tns = getTopic(topic);
        if (!tns) return;
		update(tns, message, topic, topic);
    };

    module.subscribe = function (topic, fn){
        util.forEach(util.isArray(topic) ? topic : [topic], function (topic){
			if(!testTopic(topic)) return;
            topic = setTopic(topic);
            topic['__listeners__'] = topic['__listeners__'] || [];
            util.forEach(util.isArray(fn) ? fn : [fn], function (fn){
                util.isFunction(fn) && util.indexOf(topic['__listeners__'], fn) === -1 && topic['__listeners__'].push(fn);
            });
        });
    };

    module.publish = function (topic, message){
        util.forEach(util.isArray(topic) ? topic : [topic], function (topic){
            testTopic(topic) && notify(message, topic);
        });
    };

    module.unsubscribe = function (topic, fn){
        switch (arguments.length) {
            case 0:
                TOPIC_STACK = {};
                break;
            case 1:
                util.forEach(util.isArray(topic) ? topic : [topic], function (topic){
					if(!testTopic(topic)) return;
                    var nsarr = topic.split('.');
                    var tnsstr = nsarr.pop();
                    var pns = getTopic(nsarr.join('.')) || TOPIC_STACK;
                    pns[tnsstr] = {};
                    cleanTopic(topic);
                });
                break;
            default :
                util.forEach(util.isArray(topic) ? topic : [topic], function (topic){
					if(!testTopic(topic)) return;
                    var tns = getTopic(topic);
                    if (!tns || !tns['__listeners__']) return;
                    util.forEach(util.isArray(fn) ? fn : [fn], function (fn){
                        util.remove(tns['__listeners__'], fn);
                    });
                    !tns['__listeners__'].length && delete tns['__listeners__'];
                    cleanTopic(topic);
                });
                break;
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

