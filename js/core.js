var zenzen_noauth = 1;
if (typeof initClientIdHistoryId !== "undefined") {
    // from python the initObj are escaped, <> is &lt;&gt;
    // need to unescape them back to js strings.
    function safeHtmlToJSstring(html) {
	// unescape
	return $("<span>").html(html).text();
    }
    var initObj = initClientIdHistoryId();
    var historyId         = safeHtmlToJSstring(initObj["historyId"]);
    var CLIENT_ID         = safeHtmlToJSstring(initObj["CLIENT_ID"]);
    var API_VERSION       = safeHtmlToJSstring(initObj["API_VERSION"]);
    var autocomplete_should_reload = false;
    var LL                = safeHtmlToJSstring(initObj["LL"]);
    var NEAR              = safeHtmlToJSstring(initObj["NEAR"]);
    var TIMELINE_ID       = safeHtmlToJSstring(initObj["TIMELINE_ID"]);
    var TIMELINE_NAME     = safeHtmlToJSstring(initObj["TIMELINE_NAME"]);
}

function Cookie() {
    var that = this;
    var to_str = this.to_str = function (obj) {
	return JSON.stringify(obj);
    }
    var clear_cookie = this.clear_cookie = function (key, path, domain, secure) {
	var cookie_string = key + "=" ;

	var dt = new Date();
	dt.setTime(dt.getTime() - 1);
	cookie_string += "; expires=" + dt.toGMTString();

	if (path)
	    cookie_string += "; path=" + escape (path);

	if (domain)
	    cookie_string += "; domain=" + escape (domain);

	if (secure)
	    cookie_string += "; secure";

        console.log("clear cookie: " + cookie_string);
	document.cookie = cookie_string;
    }
    var set_cookie = this.set_cookie = function (key, value, path, domain, secure) {
	var cookie_string = key + "=" + escape (value);

	if (path)
	    cookie_string += "; path=" + escape (path);

	if (domain)
	    cookie_string += "; domain=" + escape (domain);

	if (secure)
	    cookie_string += "; secure";

        console.log("set cookie: " + cookie_string);
	document.cookie = cookie_string;
    }
    var push_timeline = this.push_timeline = function(id, name, town, lastdt, foursquare_recommend_offset) {
	var obj = { "id": id, "name": name, "town": town, "lastdt": lastdt, "foursquare_recommend_offset": foursquare_recommend_offset };
	var key = id;
	that.timelines[key] = obj;	// assume the writing succeeds
	set_cookie(key, to_str(obj), "/");
    }
    var load = this.load = function () {
	that.cookie = document.cookie;
	that.timelines = {}
	$.each(that.cookie.split(';'), function (i, item) {
	    item = item.split('=');
	    if (item.length != 2) {
		console.log("item.length != 2: " + item);
		console.log(item);
		return;
	    }
	    var key = item[0].trim();
	    var value = item[1].trim();

	    value = unescape(value)
	    try{
		value = JSON.parse(value)
		if (value && value.id == key && value.name && value.lastdt) {
		    value.lastdt = new Date(value.lastdt);
		    that.timelines[key] = value;
		}
		else {
		    console.log("possibly this is not a timeline cookie");
		    console.log(value);
		    // throw { "value": value, "msg":"value is not valid" };
		}
	    }
	    catch (e) {
		console.log("possibly this is not a valid cookie");
		console.log(e);
		console.log(value);
		clear_cookie(key, "/");
	    }
	});
    }
    this.timelines = {}

    load();
    return this;
}

function ClassToggler(descriptor) {
    // I just assume there is only one element selected.
    var that = this;
    var apply = this.apply = function() {
	$.each(descriptor, function (selector, obj) {
	    var mapping = obj.mapping;
	    var callbacks = obj.callbacks;
	    var $elements = $(selector);
	    var temp = {};
	    $.each(mapping, function (cssClass, bool_func) {
		var on;
		if (typeof bool_func === "function") {
		    on = bool_func();
		}
		else {
		    on = !! bool_func;
		}
		var previous = $elements.hasClass(cssClass);
		temp[cssClass] = on ? 1 : 0
		if (on) {
		    $elements.addClass(cssClass);
		}
		else {
		    $elements.removeClass(cssClass);
		}
		if (callbacks && callbacks[cssClass]) {
		    callbacks[cssClass](on, previous);
		}
	    });
	});
    }
    return this;
}

var ck = new Cookie();
var foursquare_recommend_offset = 0;

if (typeof initObj !== "undefined") {
    if (ck.timelines.hasOwnProperty(TIMELINE_ID) && ck.timelines[TIMELINE_ID].foursquare_recommend_offset) {
        foursquare_recommend_offset = ck.timelines[TIMELINE_ID].foursquare_recommend_offset;
    }
    ck.push_timeline(TIMELINE_ID, TIMELINE_NAME, NEAR, new Date(), foursquare_recommend_offset);
}
