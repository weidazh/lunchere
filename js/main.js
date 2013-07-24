/*
window.addEventListener("load", function load() {
    disable_all();

    window.removeEventListener("load", load, false);
    document.getElementById("logout").addEventListener("click", function() {
	gapi.auth.setToken(null);
	historyId = undefined;
	today_recommendation = undefined;
	document.getElementById("historyId").innerHTML = "undefined";
	document.getElementById("today").innerHTML = "reloading ...";
	document.getElementById("confirmed").innerHTML = "";
	// signin(true, user_authed_no_retry);
	document.location = "/logout";
    });
    document.getElementById("deletemeal").addEventListener("click", function() {
	deletemeal();
    });
    document.getElementById("prevmeal").addEventListener("click", function() {
	prevmeal();
    });
    document.getElementById("nextmeal").addEventListener("click", function() {
	nextmeal();
    });
    document.getElementById("createmeal").addEventListener("click", function() {
        // currently if createmeal, it must be nextmeal
	nextmeal();
    });
    document.getElementById("yes").addEventListener("click", function() {
	confirm_today(get_today_recommendation_name(), "");
    });
    document.getElementById("no").addEventListener("click", function() {
	cancel_today();
    });
    document.getElementById("go").addEventListener("click", function() {
	confirm_today(document.getElementById("newplace").value, "");
    });
}, false);
*/

function debug_obj(prefix, obj) {
    console.log(prefix);
    console.log(obj);
}

function LoadingSpinners() {
    var that = this;
    var show_loading = this.show_loading = function() {
	$(".loading-placeholder").each(function(i, obj) {
	    var opts = {
		lines: 9, // The number of lines to draw
		corners: 0.8, // Corner roundness (0..1)
		rotate: 0, // The rotation offset
		direction: 1, // 1: clockwise, -1: counterclockwise
		color: '#000', // #rgb or #rrggbb
		speed: 1, // Rounds per second
		trail: 60, // Afterglow percentage
		shadow: false, // Whether to render a shadow
		hwaccel: false, // Whether to use hardware acceleration
		className: 'spinner', // The CSS class to assign to the spinner
		zIndex: 1, // The z-index (defaults to 2000000000)
		top: "auto", // Top position relative to parent in px
		left: "auto", // Left position relative to parent in px

		length: 10, // The length of each line
		width: 8, // The line thickness
		radius: 10, // The radius of the inner circle
	    };
	    var radius = $(obj).width();
	    if (!radius)
		radius = 9;
	    opts.length = radius / 2;
	    opts.radius = radius / 2;
	    opts.width = 2 * Math.PI * opts.radius / opts.lines / 2;

	    if (obj._spinner) {
		obj._spinner.stop();
	    }
	    else {
		obj._spinner = new Spinner(opts);
	    }
	    obj._spinner.spin(obj);
	});
    }
    var stop_loading = this.stop_loading = function() {
	$(".loading-placeholder").each(function(i, obj) {
	    if (obj._spinner) {
		obj._spinner.stop();
		obj._spinner = null;
	    }
	});
    }
    var loading_callback = this.loading_callback = function(on, previous) {
	if (on) {
	    show_loading();
	}
	else {
	    stop_loading();
	}
    }
    return this;
}

function BodyClass(current_view, hashurl, loading_spinners) {
    var that = this;
    var confirmed = this.confirmed = function () {
	return current_view.get_confirmed();
    }
    var not_confirmed = this.not_confirmed = function () {
	return ! confirmed();
    }
    var is_failed = this.is_failed = function () {
	return hashurl.get_flag("failed");
    }
    var refresh = this.refresh = function () {
	var mapping = {
	    "yes-confirmed": confirmed,
	    "no-confirmed": not_confirmed,
	    "old": function() { return ! hashurl.new_mode(); },
	    "loading": current_view.loading_title,
	    "failed": is_failed,
	    "no-foursquare": current_view.not_has_foursquare_details,
	    "no-refreshing": function () { return ! current_view.loading_details(); },
	    "refreshing": current_view.loading_details,
	    "api-loading": lunchere_api.api_loading,
	    "typehere-focusing": function () { return autocomplete.focusing; },
	    "debugging": function () { return hashurl.get_flag("debug"); },
	    "initialize": function () { return !(lunchere_api.is_ready() && hashurl.is_initialized()); },
	};
	// debug_obj("BodyClass.refresh with mapping = ", mapping);
	var callbacks = {
	    "loading": loading_spinners.loading_callback,
	    "refreshing": current_view.refreshing,
	    "typehere-focusing": autocomplete.try_focus,
	};
	var $body = $("body");
	var temp = {};
	$.each(mapping, function (cssClass, bool_func) {
	    var on = bool_func();
	    var previous = $body.hasClass(cssClass);
	    temp[cssClass] = on ? 1 : 0;
	    if (on) {
		$body.addClass(cssClass);
	    }
	    else {
		$body.removeClass(cssClass);
	    }
	    if (callbacks[cssClass]) {
		callbacks[cssClass](on, previous);
	    }
	});
	// debug_obj("                         temp = ", temp);
    }
    return this;
}
function HashURL() {
    // Hash could be changed to a list of flags, a dict!
    // status could be toload, loading, confirmed
    // noload could be noload or !noload
    // old could be old or !old
    var DEFAULT_HASH = "#!confirmed,!noload,!old,!failed,id=,4sq=,!debug";
    var that = this;
    this.flags = {};
    this.initialized = false;
    var is_initialized = this.is_initialized = function () {
	return that.initialized;
    }
    var _get_flag = this._get_flag = function (flags, key) {
	return flags.hasOwnProperty(key) ? flags[key] : that.default_flags[key];
    }
    var get_flag = this.get_flag = function (key) {
	return _get_flag(that.flags, key);
    }
    var not_equal = this.not_equal = function (fa, fb) {
	var ne = false;
	$.each(fa, function(k, v) {
	    if (v != _get_flag(fb, k))
		ne = true;
	});
	$.each(fb, function(k, v) {
	    if (v != _get_flag(fa, k))
		ne = true;
	});
	return ne;
    }
    var recognize_new_hash = this.recognize_new_hash = function () {
	var new_flags = _parse_hash(document.location.hash);
	var changed = false;
	if (not_equal(that.flags, new_flags) || ! that.initialized) {
	    that.initialized = true;
	    that.flags = new_flags;
	    that.hash = document.location.hash;
	    changed = true;
	    console.log("recognize new hash " + that.hash);
	}
	_set_body_class(new_flags);
	return changed;
    }
    var _parse_hash = this._parse_hash = function (hash) {
	if (hash == "" || hash == "#") {
	    hash = DEFAULT_HASH;
	}
	var flags = {};
	if (hash[0] == '#')
	    hash = hash.slice(1); // get rid of the '#'
	$.each(hash.split(','), function (i, tag) {
	    var flag = true;
	    if (tag[0] == '!') {
		flag = false;
		tag = tag.slice(1);
	    }
	    else if (tag.indexOf("=") > 0) {
		var assigment = tag.split("=");
		tag = assigment[0];
		flag = unescape(assigment[1]);
	    }
	    flags[tag] = flag;
	});
	return flags;
    }
    var _encode_hash = this._encode_hash = function () {
	var non_default_flags = {};
	$.each(that.flags, function (k, v) {
	    if (_get_flag(that.default_flags, k) !== v) {
		non_default_flags[k] = v;
	    }
	});
	var tags = "";
	$.each(non_default_flags, function (k, v) {
	    var tag;
	    if (v === true) {
		tag = k;
	    }
	    else if (v === false) {
		tag = "!" + k;
	    }
	    else {
		tag = k + "=" + escape(v);
	    }
	    if (tags)
		tags = tags + "," + tag;
	    else
		tags = tag;
	});
	return tags;
    }
    var _set_body_class = this._set_body_class = function (flags) {
	body_class.refresh();
    }
    var copy = this.copy = function (flags) {
	var new_flags = {};
	$.each(flags, function(k, v){
	    new_flags[k] = v;
	});
	return new_flags;
    }
    /*
    var goes_to_loading = this.goes_to_loading = function (canteen_id, foursquare_id) {
	// do not change the url, only set the classes
	console.log("goes_to_loading " + canteen_id + " " + foursquare_id);
	var new_flags = copy(that.flags);
	new_flags["confirmed"] = false;
	new_flags["id"] = canteen_id;
	new_flags["4sq"] = foursquare_id;
	document.location.hash = that.hash = _encode_hash();
	recognize_new_hash();
    }
    var goes_to_normal = this.goes_to_normal = function (canteen_id, foursquare_id) {
	console.log("goes_to_normal " + canteen_id + " " + foursquare_id);
	that.flags["confirmed"] = false;
	that.flags["id"] = canteen_id;
	that.flags["4sq"] = foursquare_id;
	document.location.hash = that.hash = _encode_hash();
	recognize_new_hash();
    }
    var goes_to_failed = this.goes_to_failed = function () {
	console.log("goes_to_failed");
	that.flags["failed"] = true;
	document.location.hash = that.hash = _encode_hash();
	recognize_new_hash();
    }
    var goes_to_confirmed = this.goes_to_confirmed = function () {
	console.log("goes_to_confirmed");
	that.flags["confirmed"] = true;
	document.location.hash = that.hash = _encode_hash();
	recognize_new_hash();
    }
    */
    var set_hash = this.set_hash = function (resp) {
	that.flags["id"] = resp.name ? resp.name : "";
	that.flags["4sq"] = resp.foursquare_id ? resp.foursquare_id : "";
	var encoded_hash = _encode_hash();
	console.log("set_hash to " + encoded_hash);
	document.location.hash = that.hash = encoded_hash;
	recognize_new_hash();
    }

    var new_mode = this.new_mode = function () {
	return ! get_flag("old");
    }
    var noload = this.noload = function () {
	return get_flag("noload");
    }

    this.default_flags =  _parse_hash(DEFAULT_HASH);
}


function MainUI() {
    var init = this.init = function () {
	$("#toggle-info-map").click(function() {
	    // make this into hashurl!!
	    if ($("#main-container").hasClass("no-info-map")) {
		$("#main-container").removeClass("no-info-map");
	    }
	    else {
		$("#main-container").addClass("no-info-map");
	    }
	}).removeClass("disabled").addClass("enabled");

	$("#extra-toggle").click(function() {
	    if ($("#main-container").hasClass("no-details-buttons")) {
		$("#main-container").removeClass("no-details-buttons");
	    }
	    else {
		$("#main-container").addClass("no-details-buttons");
	    }
	}).removeClass("disabled").addClass("enabled");

	$("#options-yes").click(current_view.yes_clicked).removeClass("disabled").addClass("enabled");

	$("#options-no").click(current_view.no_clicked).removeClass("disabled").addClass("enabled");

	$("#review-reselect").click(current_view.no_clicked).removeClass("disabled").addClass("enabled");

	$("#delete-this-meal").click(current_view.delete_clicked).removeClass("disabled").addClass("enabled");

	$("#review-delete-meal").click(current_view.delete_clicked).removeClass("disabled").addClass("enabled");

	$("#timeline-button-left").click(current_view.left_clicked).removeClass("disabled").addClass("enabled");
	$("#timeline-button-right").click(current_view.right_clicked).removeClass("disabled").addClass("enabled");

	$(".timeline-div.plus").click(function() {
	    createmeal();
	    // use current_view
	}).removeClass("disabled").addClass("enabled");

	$("#review-delete").click(function() {
	    deletemeal();
	    // use current_view
	}).removeClass("disabled").addClass("enabled");

	$(window).on("hashchange", function() {
	    current_view.on_hashchange();
	});
    }
    var goto_hash = this.goto_hash = function () {
	var hash_changed = hashurl.recognize_new_hash();
	if (hash_changed) {
	    console.log("[HASHURL] hash_changed by user");
	    lunchereCache.fetch(
	        hashurl.get_flag("id"),
	        hashurl.get_flag("4sq"),
		function(resp, venue) {
		    console.log("[MainUI] goto_hash calling new_backend.receive");

                    new_backend.receive(resp, venue);
		    // today_recommendation_received(resp, venue);
		    // TODO
		});
	}
    }
    return this;
}

function FoursquareFormatted(venue) {
    var that = this;
    var _format_hours = this._format_hours = function () {
    }
    var _format_icon = this._format_icon = function () {
	var icon_backup;
	var icon;
	$.each(venue.categories, function(i, category) {
	    if (category.primary) {
		icon = category.icon.prefix + "88" + category.icon.suffix;
	    }
	    else {
		icon_backup = category.icon.prefix + "88" + category.icon.suffix;
	    }
	});
	if (!icon)
	    icon = icon_backup;
	return icon;
    }
    var _format_canonical_url = this._format_canonical_url = function () {
	return venue.canonicalUrl;
    }
    var _format_addr = this._format_addr = function () {
	// Category in Location
	var cat = "Food";
	$.each(venue.categories, function(i, category) {
	    if (category.primary) {
		cat = category.name;
	    }
	});
	var addr;
	var at = " at ";
	$.each(["address", "crossStreet", "city", "state", "country", "cc", "postalCode", "lat-lng"], function(i, key) {
	    if (!addr) {
		if (key == "lat-lng")
		    addr = venue.location.lat + "," + venue.location.lng;
		else if (key == "crossStreet") {
		    at = " ";
		    addr = venue.location[key];
		}
		else
		    addr = venue.location[key];
	    }
	});
	return cat + at + addr;
    }
    var _format_distance = this._format_distance = function () {
	if (venue.location.distance) {
	    return Math.ceil(venue.location.distance / 100) + " min walk"
	}
	else {
	    return "nearby";
	}
    }
    var _show_map = this._show_map = function () {
	// Use Google Maps API to show the location.
    }
    var _format_detailed_addr = this._format_detailed_addr = function () {
	if (venue.location.crossStreet) {
	    return venue.location.address + "("  + venue.location.crossStreet + ")";
	}
	else {
	    return venue.location.address;
	}
    }
    var _format_contact = this._format_contact = function () {
	if (venue.contact) {
	    if (venue.contact.formattedPhone) {
		return venue.contact.formattedPhone;
	    }
	    else if (venue.contact.phone) {
		return venue.contact.phone;
	    }
	    else if (venue.contact.twitter) {
		return "@"  + venue.contact.twitter;
	    }
	}
	else {
	    return "";
	}
    }
    var apply = this.apply = function (mapping) {
	// debug_obj("FoursquareFormatted.apply with mapping =", mapping);
	// debug_obj("                                  this =", that);
	function debug(element_id) {
	    return;
	    $(element_id).addClass("debug");
	    setTimeout(function() {
		$(element_id).removeClass("debug");
	    }, 1000);
	}
	$.each(mapping, function(k, v) {
	    if (typeof v === "string" ) {
		var element_id = v;
		$(element_id).text(that[k]);
		debug(element_id);
	    }
	    else if (typeof v === "function") {
		var callback = v;
		var element_id = callback(that[k]);
		debug(element_id);
	    }
	});
    }
    var that = this;
    this.icon = _format_icon();
    // this.name = venue.name; // venue's name should be replaced by lunchere name.
    this.hours = _format_hours();
    this.addr = _format_addr();
    this.distance = _format_distance();
    this.map = _show_map();
    this.detailed_addr = _format_detailed_addr();
    this.contact = _format_contact();
    this.apply = apply;
    this.canonicalUrl = _format_canonical_url();
    return this;
}

function GeoAPI() {
    // The location should be passed from the server
}

function LunchereAutocomplete(current_view, lunchere_api) {
    var that = this;
    this.choices = [];
    this.context = {
	"history_id": "",
	"timeslot": "",
    };
    var reset = this.reset = function () {
	// reset when the complete list would change
	// even historyId, timeslot does not change
	that.context = {
	    "history_id": "",
	    "timeslot": "",
	}
    }
    var _reload = this._reload = function (callback) {
	if (that.context.history_id == current_view.get_history_id() &&
	    that.context.timeslot == current_view.get_timeslot())
	{
	    callback(that.choices);
	}
	var context = {
	    "history_id": current_view.get_history_id(),
	    "timeslot": current_view.get_timeslot(),
	}
	lunchere_api.choices(
	    context.history_id, context.timeslot,
	    function (resp) {
		if (! resp.choices)
		    resp.choices = [];
		that.choices = resp.choices;
		that.context = context;
		callback(that.choices);
	    });
	
    }
    var regex_escape = this.regex_escape = function (q0) {
	var x = "";
	for (var i = 0; i < q0.length; i++) {
	    var ch = $.ui.autocomplete.escapeRegex(q0.charAt(i));
	    x += ch + ".*";
	}
	return x;
    }
    var reload = this.reload = function (request, response_callback) {
	var q0 = request.term;
	var q = encodeURI(q0);
	_reload(function (data) {
            var q0exp = RegExp(regex_escape(q0), "i");
	    var a = [];
	    $.each(data, function (i, obj) {
                if (q0exp.test(obj.canteen_id)) {
                    a.push({
                        "label": obj.canteen_id,
                        "value": obj.canteen_id,
                        "type": "lunchere",
                        "obj": obj,
                    });
                }
	    });
	    response_callback(a);
	});
    }
    return this;
}

function FoursquareAPI(NOLOGIN_SUFFIX, LL) {
    var FOOD_ID = "4d4b7105d754a06374d81259";
    var that = this;
    var auth = NOLOGIN_SUFFIX; // TODO use this.auth
    var ll = LL; // TODO  use this.ll
    var url_field = this.url_field = function (k, v) {
	return escape(k) + "=" + escape(v);
    }
    var category_food_id = this.category_food_id = function () {
	return "categoryId=" + FOOD_ID;
    }
    var search_food = this.search_food = function (q0, done, fail) {
	var suggestcompletion = "search";
	var url = "https://api.foursquare.com/v2/venues/" + suggestcompletion
	    + "?" + ll
	    + "&" + category_food_id()
	    + "&" + url_field("radius", "1000")
	    + "&" + url_field("limit", "10")
	    + "&" + url_field("query", q0)
	    + "&" + auth;
	$.ajax({ "url": url }).done(done).fail(fail);
    }
    return this;
}

function FoursquareAutocomplete(foursquare_api) {
    var that = this;
    var cache = {}; // TODO use this.cache
    var minivenue_is_food = this.minivenue_is_food = function (minivenue) {
	var is_food = false;
	$.each(minivenue.categories, function(j, category) {
	    var prefix = category.icon.prefix;
	    if (! prefix)
		prefix = category.icon;
	    if (/\/food\//.test(prefix)) {
		is_food = true;
	    }
	});
	return is_food;
    }
    var reload = this.reload = function (request, response_callback) {
	var q0 = request.term;
	if (cache.hasOwnProperty(q0))
	    return cache[q0];
	if (q0.length >= 1) {
	    var minivenues = "venues"; // instead of "minivenues";
	    foursquare_api.search_food(q0,
	    function(data) {
		var a = [];
		$.each(data.response[minivenues], function(i, minivenue) {
		    // because this is minivenue, do not cache?
		    var name = minivenue.name + " @ " + minivenue.location.address;
		    var name_addr = minivenue.name + " @ " + minivenue.location.address + " (" + minivenue.location.distance + "m)";
		    console.log(name_addr);
		    var is_food = minivenue_is_food(minivenue);
		    if (is_food && a.indexOf(name) < 0)
			a.push({
			    "label": name,
			    "value": name,
			    "type": "foursquare",
			    "obj": minivenue
			});
		});
		cache[q0] = a;
		response_callback(a);
	    }, function() {
		response_callback([]);
	    });
	}
    }
    return this;
}

function Autocomplete(lunchere_autocomplete, foursquare_autocomplete) {
    var that = this;
    this.newest_q0 = "";
    this.separator = {
	"label": "-----------",
	"value": "-----------",
	"type": "separator",
    };
    var reload = this.reload = function (request, response_callback) {
	var q0 = request.term;
	var a_lunchere = null;
	var a_foursquare = null;
	that.newest_q0 = q0;
	function callback_both() {
	    if (q0 == that.newest_q0) {
		var a = a_lunchere.concat(that.separator).concat(a_foursquare);
		response_callback(a);
	    }
	    else {
		// just ignore it.
	    }
	}
	function callback_lunchere(a) {
	    a_lunchere = a;
	    if (a_foursquare !== null)
		callback_both();
	}
	function callback_foursquare(a) {
	    a_foursquare = a;
	    if (a_lunchere !== null)
		callback_both();
	}
	lunchere_autocomplete.reload(request, callback_lunchere);
	foursquare_autocomplete.reload(request, callback_foursquare);
    }
    var bind_ui = this.bind_ui = function () {
	$("#newplace").focus(function() {
	    $("#newplace").autocomplete("search");
	});

	$("#newplace").autocomplete({
	    source: that.reload,
	    minLength: 0,
	    select: that.on_select,
	});

	$("#typehere").focus(function() {
	    if ($("#typehere").val() == "type here" && $("#typehere").attr("valuesource") == "type here") {
		$("#typehere").val("");
	    }
	    $("#typehere").autocomplete("search");

	    that.focusing = true;
	});

	$("#typehere").blur(function () {
	    that.focusing = false;

	});

	$("#typehere").autocomplete({
	    source: that.reload,
	    delay: 200,
	    minLength: 0,
	    select: that.on_select,
	    position: {
		"my": "left bottom",
		"at": "left bottom",
		"of": "#typehere-autocomplete-container",
		"collision": "none",
	    },
	});
    }

    var try_focus = this.try_focus = function(on, previous) {
	if (on) {
	    $("#typehere").focus();
	}
	else {
	    //
	}
    }

    this.on_select = function() { console.log("on_select"); }
    // TODO on_select
    return this;
}


function LunchereAPI() {
    var zenzen_noauth = true;
    var that = this;
    this.gapi = null;
    this.lunchere = null;
    this.loaded = false;
    this.should_reset = false;
    var gapi_ready = this.gapi_ready = function (gapi) {
	that.gapi = gapi;
	that.old_init();
    }
    var is_ready = this.is_ready = function() {
	return !! that.gapi;
    }
    var api_loading = this.api_loading = function () {
	return ! that.loaded;
    }
    var old_init = this.old_init = function () {
	init(function() {
	    that.lunchere = that.gapi.client.lunchere;
	    that.loaded = true;
	    console.log("[LunchereAPI] LunchereAPI loaded");

	    body_class.refresh();
	    that.on_load();
	}, function() {
	    console.log("[LunchereAPI] LunchereAPI load failed!");
	});
    }
    var init = this.init = function (loaded_done, loaded_fail) {
	var apisToLoad;
	var token_received = function(token) {
	    if (token) {
		token.access_token = token.id_token;
		that.gapi.auth.setToken(token);
		loaded_done();
	    }
	    else {
		// or call loaded_done even the auth failed
		loaded_fail();
	    }
	}
	var callback = function() {
	    console.log("[LunchereAPI] LunchereAPI.init - " + (apisToLoad - 1) + " APIs to load");
	    if (--apisToLoad == 0) {
		if (! that.gapi.client.lunchere)
		    loaded_fail();
		else if (zenzen_noauth)
		    loaded_done();
		else
		    _signin(true, token_received);
	    }
	}
	var ROOT = '/_ah/api';
	apisToLoad = 2;
	if (zenzen_noauth) {
	    apisToLoad -= 1;
	}
	else {
	    that.gapi.client.load('oauth', API_VERSION, callback, ROOT);
	}
	that.gapi.client.load('lunchere', API_VERSION, callback, ROOT);
    }
    var _signin = this._signin = function (mode, callback) {
	if (zenzen_noauth) {
	    if (mode) {
		callback(null);
	    }
	    else {
		console.log("ERROR: singin not immediately but zenzen_noauth");
	    }
	}
	else {
	    var SCOPES = "https://www.googleapis.com/auth/userinfo.email";
	    that.gapi.auth.authorize({client_id: CLIENT_ID,
		    scope: SCOPES, immediate: mode,
		    response_type: 'token id_token'},
		    callback);
	}
    }

    var _send_request = this._send_request = function (loginfo, func, req, callback) {
	req.api_version = API_VERSION;
	console.log("SEND REQ " + loginfo + " with req=");
	console.log(req);

	func(req).execute(function(resp) {
	    console.log("RECV RESP " + loginfo + " with resp=");
	    console.log(resp);
	    callback(resp);
	});
    }

    var delete_meal = this.delete_meal = function (history_id, timeslot, callback) {
	that.should_reset = true;
	_send_request("delete_meal", that.gapi.client.lunchere.deletemealUnauth, {
	    "historyId": history_id,
	    "timeslot": timeslot
	}, callback);
    }

    var prev_meal = this.prev_meal = function (history_id, timeslot, callback) {
	_send_request("prev_meal", that.gapi.client.lunchere.prevmealUnauth, {
	    "historyId": history_id,
	    "timeslot": timeslot
	}, callback);
    }

    var next_meal = this.next_meal = function (history_id, timeslot, callback) {
	_send_request("next_meal", that.gapi.client.lunchere.nextmealUnauth, {
	    "historyId": history_id,
	    "timeslot": timeslot
	}, callback);
    }

    var create_meal = this.create_meal = function (history_id, timeslot, callback) {
	that.should_reset = true;
	_send_request("create_meal", that.gapi.client.lunchere.nextmealUnauth, {
	    "historyId": history_id,
	    "timeslot": timeslot
	}, callback);
    }

    var confirm_meal = this.confirm_meal = function (history_id, timeslot, canteen_id, foursquare_id, callback) {
	that.should_reset = true;
	_send_request("confirm_meal", that.gapi.client.lunchere.yesUnauth, {
	    "historyId": history_id,
	    "timeslot": timeslot,
	    "name": canteen_id,
	    "foursquare_id": foursquare_id,
	}, callback);
    }

    var cancel_meal = this.cancel_meal = function (history_id, timeslot, canteen_id, foursquare_id, callback) {
	that.should_reset = true;
	_send_request("cancel_meal", that.gapi.client.lunchere.noUnauth, {
	    "historyId": history_id,
	    "timeslot": timeslot,
	    "name": canteen_id,
	    "foursquare_id": foursquare_id,
	}, callback);
    }
    var choices = this.choices = function (history_id, timeslot, callback) {
	_send_request("choices", that.gapi.client.lunchere.choices, {
	    "historyId": history_id,
	    "timeslot": timeslot
	}, callback);
    }
    var pop_should_reset = this.pop_should_reset = function () {
	var ret = that.should_reset;
	that.should_reset = false;
	return ret;
    }
    this.on_load = function () { console.log("LunchereAPI.on_load"); };
    return this;
}

function NewBackend(current_view, lunchereCache, foursquareCache, lunchere_api, lunchere_autocomplete) {
    var that = this;
    var generate_resp_from_venue = this.generate_resp_from_venue = function (venue) {
	// TODO
    }
    var get_ll_near_from_resp_hints = this.get_ll_near_from_resp_hints = function (resp, callback_ll_near) {
	var ll_near;
	if (resp && resp.hints && (resp.hints.ll || resp.hints.near)) {
	    ll_near = resp.hints;
	    callback_ll_near(ll_near);
	}
	else {
	    if (navigator && navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
		    ll_near = resp.hints = resp.hints = {}
		    resp.hints.ll = position.coords.latitude + "," + position.coords.longitude;
		    callback_ll_near(ll_near);
		});
	    }

	}
    }
    var both_cached_from_ll_near = this.both_cached_from_ll_near = function (ll_near, callback) {
	foursquareCache.fetch_recommendation(ll_near.ll, ll_near.near,
	    function (name, venue) {
		// TODO add to lunchereCache
		lunchereCache.fetch(name, venue.id, callback);
	    });
    }
    var empty_lunch_received = this.empty_lunch_received = function (resp, venue) {
	// though empty, resp contains hints which include ll
	body_class.refresh();
	get_ll_near_from_resp_hints(resp, function (ll_near) {
	    both_cached_from_ll_near(ll_near, function(resp, venue) {
		// TODO
		that.receive(resp, venue);
	    });
	});
    }
    var receive = this.receive = function (resp, venue) {
	// debug_obj("NewBackend.receive with resp =", resp);
	// debug_obj("                       venue =", venue);
	if ((!resp || !resp.name) && venue) {
	    resp = generate_resp_from_venue(venue);
	}
	if (resp.historyId && resp.historyId != current_view.get_history_id()) {
	    current_view.set_history_id(resp.historyId);
	}
	if (! resp.name && ! venue) {
	    empty_lunch_received(resp, venue);
	}
	else {
	    current_view.set_view(resp);
	}
	if (lunchere_api.pop_should_reset())
	    lunchere_autocomplete.reset();
    }
}

function FoursquareCache() {
    var that = this;
    this.cache = {};
    var fetch = this.fetch = function (id, callback) {
	get_details_from_foursquare(id, function(venue) {
	    console.log("[FoursquareCache] foursquare returns, I hope the title is updated");
	    setTimeout(function() {
		console.log("[FoursquareCache] foursquare returns");
		that.cache[id] = venue;
		callback(venue);
	    }, 0);
	});
    }
    var fetch_recommendation = this.fetch_recommendation = function (ll, near, callback) {
	get_recommendation_from_foursquare(ll, near, function(name, venue) {
	    that.cache[venue.id] = venue;
	    callback(name, venue);
	});
    }
    var has = this.has = function (id) {
	return that.cache.hasOwnProperty(id);
    }
    return this;
}

function LunchereCache(foursquareCache, get_history_id, get_timeslot) {
    var that = this;
    this.cache = {};
    var fetch_4sq = this.fetch_4sq = function (resp, callback_resp_venue) {
	var lunch = resp;
	var canteen_id = resp.name;
	var foursquare_id = resp.foursquare_id;
	that.cache[canteen_id] = lunch;
	if (foursquare_id) {
	    foursquareCache.fetch(foursquare_id, function(venue) {
		callback_resp_venue(lunch, venue);
	    });
	}
	else {
	    callback_resp_venue(lunch, null);
	}
    }
    var fetch = this.fetch = function (canteen_id, foursquare_id, callback_resp_venue) {
	var lunch = {
	    "historyId": get_history_id(),
	    "timeslot": get_timeslot(),
	    "name": canteen_id,
	    "foursquare_id": foursquare_id,
	};
	that.cache[canteen_id] = lunch;
	if (foursquare_id) {
	    foursquareCache.fetch(foursquare_id, function(venue) {
		callback_resp_venue(lunch, venue);
	    });
	}
	else {
	    callback_resp_venue(lunch, null);
	}
    }
    var has_title = this.has_title = function (canteen_id) {
	if (that.cache.hasOwnProperty(canteen_id)) {
	    return true;
	}
	return false;
    }
    var has = this.has = function (canteen_id, foursquare_id) {
	if (that.cache.hasOwnProperty(canteen_id) && !foursquare_id) {
	    foursquare_id = that.cache[canteen_id];
	}
	if (foursquareCache.has(foursquare_id)) {
		return true;
	}
	return false;
    }
    var add = this.add = function (canteen_id, resp) {
	that.cache[canteen_id] = resp;
	if (resp.foursquare_id) {
	    foursquareCache.fetch(resp.foursquare_id, function(venue) { });
	}
    }

    return this;
}

function CurrentView(history_id, lunchereCache, foursquareCache) {
    var that = this;
    this.canteen_id = "";
    this.foursquare_id = "";
    this.history_id = history_id;
    this.timeslot = null;
    this.confirmed = false;
    this.lunch = null;
    var get_name = this.get_name = function () {
	return that.canteen_id;
    }
    var get_4sq = this.get_4sq = function () {
	return that.foursquare_id;
    }
    var get_history_id = this.get_history_id = function () {
	return that.history_id; /* global */
    }
    var get_timeslot = this.get_timeslot = function () {
	return that.timeslot;
    }
    var get_canteen_id = this.get_canteen_id = function () {
	return that.canteen_id;
    }
    var get_foursquare_id = this.get_foursquare_id = function () {
	return that.foursquare_id;
    }
    var get_confirmed = this.get_confirmed = function () {
	return that.confirmed;
    }
    var get_current_lunch = this.get_current_lunch = function () {
	if (that.lunch === null) {
	    // TODO construct one
	}
	else {
	    return that.lunch;
	}
    }
    var set_history_id = this.set_history_id = function (new_history_id) {
	that.history_id = new_history_id;
    }
    var get_resp_source = this.get_resp_source = function (resp) {
	if (resp.source)
	    return resp.source;
	else
	    return " (unknown)";
    }
    var format_venue = this.format_venue = function (resp, venue) {
	if (venue.id != resp.foursquare_id) {
	    console.log("WARNING venue.id != resp.foursquare_id")
	    return;
	}

	resp.foursquare_venue = venue;

	var formatted = new FoursquareFormatted(venue);
	var view = {
	    // "name": "#title-text", // name could be customized
	    "addr": "#title-addr",
	    "distance": "#distance",
	    "detailed_addr": "#details-addr",
	    "contact": "#details-phonenumber",
	    "icon": function(icon_url) {
		console.log("[APPLY] apply " + icon_url + " to #main-icon's background-image");
		console.log(icon_url);
		$("#main-icon").css({ "background-image": "url(" + icon_url + ")" });
		return "main-icon";
	    },
	    "canonicalUrl": function(link_url) {
		$("#external-link > a").attr("href", link_url);
		return "#external-link";
	    },
	};
	formatted.apply(view);
	body_class.refresh();
    }
    var set_view = this.set_view = function (resp) {
	// debug_obj("this.set_view with resp = ", resp);
	that.resp_cache = resp;
	// it should contains historyId, timeslot, name, and foursquare_id
	hashurl.set_hash(resp);
	$("#title-text").text(resp.name);
	$("#title-source").text(get_resp_source(resp));
	$("#confirmed-info-name").text("...");
	$("#confirmed-info-date").text(resp.timeslotFriendly);
	$("#no-confirmed-info-date").text(resp.timeslotFriendly);
	that.history_id = resp.historyId;
	that.timeslot = resp.timeslot;
	that.canteen_id = resp.name;
	that.foursquare_id = resp.foursquare_id;
	that.confirmed = resp.confirmed;
	lunchereCache.add(resp.name, resp);

	if (resp.foursquare_id) {
	    body_class.refresh();
	    foursquareCache.fetch(resp.foursquare_id, function (venue) {
		format_venue(resp, venue);
	    });
	}
	else {
	    body_class.refresh();
	}
    }
    var set_ids = this.set_ids = function (canteen_id, foursquare_id) {
	hashurl.set_hash({
	    "name": canteen_id,
	    "foursquare_id": foursquare_id,
	});
	$("#title-text").text(canteen_id);
	$("#title-source").text(" (unknown)");
	that.canteen_id = canteen_id;
	that.foursquare_id = foursquare_id;
	that.confirmed = false;

	body_class.refresh();
	lunchereCache.fetch(canteen_id, foursquare_id, format_venue);
    }
    var loading_title = this.loading_title = function () {
	if (that.canteen_id == "" || !lunchereCache.has_title(that.canteen_id)) {
	    return true;
	}
	else {
	    return false;
	}
    }
    var not_has_foursquare_details = this.not_has_foursquare_details = function() {
	return (that.foursquare_id == "" || !foursquareCache.has(that.foursquare_id));
    }
    var loading_details = this.loading_details = function () {
	if (that.canteen_id && ! that.foursquare_id) {
	    // in this case, we did not map canteen with foursquare,
	    // so this is not refreshing
	    return false;
	}
	return that.not_has_foursquare_details();
    }
    var on_lunchere_received = this.on_lunchere_received = function (resp) {
	if (that.canteen_id == resp.name) {
	    // set view
	    // set foursquare id
	    // call foursquare if possible
	}
    }
    var on_foursquare_received = this.on_foursquare_received = function (venue) {
	if (that.foursquare_id == venue.id) {
	    // set view
	    // TODO
	}
    }
    var change_hash = this.change_hash = function (new_hash) {
	//
	// TODO
    }
    var normalize = this.normalize = function (s) {
	if (!s)
	    return "";
	else
	    return s;
    }
    var on_hashchange = this.on_hashchange = function () {
	// detech what is changed.
	hashurl.recognize_new_hash();
	// hashurl has already normalized them.
	if (hashurl.get_flag("id") != normalize(this.canteen_id) ||
	    hashurl.get_flag("4sq") != normalize(this.foursquare_id)) {

            // changed.
	    that.on_hashchange_callback();

	    this.canteen_id = hashurl.get_flag("id");
	    this.foursquare_id = hashurl.get_flag("4sq");

	    lunchereCache.fetch(hashurl.get_flag("id"), hashurl.get_flag("4sq"), new_backend.receive);
	}
	else {
	    // no changes
	}
    }
    this.on_hashchange_callback = function() { console.log("this.on_hashchange_callback"); };
    this.on_status_change = function() { console.log("this.on_status_change"); };

    var yes_clicked = this.yes_clicked = function () {
	body_class.refresh();
	lunchere_api.confirm_meal(
	    get_history_id(),
	    get_timeslot(),
	    get_canteen_id(),
	    get_foursquare_id(),
	    new_backend.receive
	    /*
	    function () {
		// basically it will succeed,
		that.confirmed = true;
		that.on_status_change();
	    }
	    */
	    );
    }
    var no_clicked = this.no_clicked = function () {
	body_class.refresh();
	that.canteen_id = "";
	that.foursquare_id = "";
	lunchere_api.cancel_meal(
	    get_history_id(),
	    get_timeslot(),
	    get_canteen_id(),
	    get_foursquare_id(),
	    function (resp) {
		that.canteen_id = resp.name;
		new_backend.receive(resp, null);
	    }
	    );
    }
    var delete_clicked = this.delete_clicked = function () {
	body_class.refresh();
	that.canteen_id = "";
	that.foursquare_id = "";
	lunchere_api.delete_meal(
	    get_history_id(),
	    get_timeslot(),
	    function (resp) {
		that.timeslot = resp.timeslot;
		that.canteen_id = resp.name;
		that.foursquare_id = resp.foursquare_id;
		new_backend.receive(resp, null);
	    });
    }
    var left_clicked = this.left_clicked = function (){
	body_class.refresh();
	that.canteen_id = "";
	that.foursquare_id = "";
	lunchere_api.prev_meal(
	    get_history_id(),
	    get_timeslot(),
	    function (resp) {
		that.timeslot = resp.timeslot;
		that.canteen_id = resp.name;
		that.foursquare_id = resp.foursquare_id;
		new_backend.receive(resp, null);
	    });
    }
    var right_clicked = this.right_clicked = function () {
	body_class.refresh();
	that.canteen_id = "";
	that.foursquare_id = "";
	lunchere_api.next_meal( /* TODO if next_meal != create_meal */
	    get_history_id(),
	    get_timeslot(),
	    function (resp) {
		that.timeslot = resp.timeslot;
		that.canteen_id = resp.name;
		that.foursquare_id = resp.foursquare_id;
		new_backend.receive(resp, null);
	    });
    }
    this.refreshing_previous_info_map_height = "200px";
    this.refreshing_previous_extra_container_height = "200px";
    var refreshing = this.refreshing = function (on, previous) {
	if (on && !previous) {
	    console.log("[REFRESHING] refreshing from " + previous + " to " + on);
	    // animate it to zero height
	    that.refreshing_previous_info_map_height = $("#info-map").height();
	    that.refreshing_previous_extra_container_height = $("#extra-container").height();
	    $("#extra-container").css({"overflow": "hidden"});
	    $("#info-map").css({"overflow": "hidden"});
	    $("#extra-container").stop().animate({
		"height": "0px",
	    }, {
		"duration": 400,
	    });
	    $("#info-map").stop().animate({
		"height": "0px",
	    }, {
		"duration": 800,
		"done": function () {
		    $("#info-map").css({ "border-bottom-width": "0px" });
		}
	    });
	}
	else if (!on && previous) {
	    console.log("[REFRESHING] refreshing from " + previous + " to " + on);
	    // animate it to full height
	    $("#extra-container").stop().animate({
		"height": that.refreshing_previous_extra_container_height,
	    }, {
		"done": function() {
		    $("#extra-container").css({
			"overflow": "",
			"height": "",
		    });
		}
	    });
	    $("#info-map").stop().css({
		"border-bottom-width": "",
	    }).animate({
		"height": that.refreshing_previous_info_map_height,
	    }, {
		"done": function() {
		    $("#info-map").css({
			"overflow": "",
			"height": "",
		    });
		}
	    });
	}
    }
    return this;
}

var geo_api = new GeoAPI();
var lunchere_api = new LunchereAPI();
var mainUI = new MainUI();
var hashurl = new HashURL();
var loading_spinners = new LoadingSpinners();

var foursquareCache = new FoursquareCache();
var lunchereCache = new LunchereCache(
    foursquareCache,
    function() {
	return current_view.get_history_id();
    },
    function() {
	return current_view.get_timeslot();
    });
var current_view = new CurrentView(historyId, lunchereCache, foursquareCache);
var body_class = new BodyClass(current_view, hashurl, loading_spinners);
var lunchere_autocomplete = new LunchereAutocomplete(current_view, lunchere_api);
var foursquare_api = new FoursquareAPI(NOLOGIN_SUFFIX, LL);
var foursquare_autocomplete = new FoursquareAutocomplete(foursquare_api);
var autocomplete = new Autocomplete(lunchere_autocomplete, foursquare_autocomplete);
var new_backend = new NewBackend(current_view, lunchereCache, foursquareCache, lunchere_api, lunchere_autocomplete);

current_view.on_status_change = function() {
    body_class.refresh();
}
current_view.on_hashchange_callback = function() {
    body_class.refresh();
}
autocomplete.on_select = function(_event, ui) {
    if (ui.item.type == "foursquare") {
	console.log("on_select with item =");
	console.log(ui.item);
	$("#typehere").val(ui.item.obj.name);
	current_view.set_ids(ui.item.obj.name, ui.item.obj.id);
	_event.preventDefault();
    }
    else if (ui.item.type == "lunchere") {
	console.log("on_select with item =");
	console.log(ui.item);
	$("#typehere").val(ui.item.value);
	current_view.set_ids(ui.item.obj.name, ui.item.obj.foursquare_id);
	_event.preventDefault();
    }
    else {
	_event.preventDefault();
    }
}

var main_ui_to_load = false;
lunchere_api.on_load = function () {
    if (main_ui_to_load) {
	console.log("[PROGRESS] mainUI goto_hash (from LunchereAPI.on_load)");
	mainUI.goto_hash();
    }
}

$(document).ready(function() {
    console.log("[PROGRESS] document ready");
    console.log("[PROGRESS] autocomplete bind_ui");
    autocomplete.bind_ui();
    console.log("[PROGRESS] mainUI init");
    mainUI.init();
    if (lunchere_api.is_ready()) {
	console.log("[PROGRESS] mainUI goto_hash");
	mainUI.goto_hash();
    }
    else {
	console.log("[PROGRESS] mainUI goto_hash delayed");
	main_ui_to_load = true;
    }
});

function gapi_ready() {
    lunchere_api.gapi_ready(gapi);
}
