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

function BodyClass(current_view, hashurl, loading_spinners, autocomplete) {
    var that = this;
    var confirmed = this.confirmed = function () {
	return current_view.get_confirmed();
    }
    var not_confirmed = this.not_confirmed = function () {
	return ! confirmed();
    }
    var old_mode = this.old_mode = function () {
	return ! hashurl.new_mode();
    }
    var is_failed = this.is_failed = function () {
	return hashurl.get_flag("failed");
    }
    var loading = this.loading = function () {
	return current_view.loading_title();
    }
    var no_fousquare = this.no_fousquare = function () {
	return current_view.not_has_foursquare_details();
    }
    var refreshing = this.refreshing = function () {
	return current_view.loading_details();
    }
    var no_refreshing = this.no_refreshing = function () {
	return ! that.refreshing();
    }
    var api_loading = this.api_loading = function () {
	return lunchere_api.api_loading();
    }
    var typehere_focusing = this.typehere_focusing = function () {
	return autocomplete.focusing;
    }
    var debugging = this.debugging = function () {
	return hashurl.get_flag("debug");
    }
    var initialize = this.initialize = function () {
	return !(lunchere_api.is_ready() && hashurl.is_initialized());
    }
    var loading_callback = this.loading_callback = function (on, previous) {
	loading_spinners.loading_callback(on, previous);
    }
    var refreshing_callback = this.refreshing_callback = function (on, previous) {
	current_view.refreshing(on, previous);
    }
    var typehere_focusing_callback = this.typehere_focusing_callback = function (on, previous) {
	// autocomplete.try_focus(on, previous);
    }
    var bodyClassToggler = this.bodyClassToggler = new ClassToggler({
	"body": {
	    "mapping": {
		"yes-confirmed": this.confirmed,
		"no-confirmed": this.not_confirmed,
		"old": this.old_mode,
		"loading": this.loading,
		"failed": this.is_failed,
		"no-foursquare": this.no_fousquare,
		"no-refreshing": this.no_refreshing,
		"refreshing": this.refreshing,
		"api-loading": this.api_loading,
		"typehere-focusing": this.typehere_focusing,
		"debugging": this.debugging,
		"initialize": this.iniitialize,
	    },
	    "callbacks": {
		"loading": this.loading_callback,
		"refreshing": this.refreshing_callback,
		"typehere-focusing": this.typehere_focusing_callback,
	    }
	}
    });
    var refresh = this.refresh = function () {
	that.bodyClassToggler.apply();
    }
    return this;
}
function HashURL() {
    // Hash could be changed to a list of flags, a dict!
    // status could be toload, loading, confirmed
    // noload could be noload or !noload
    // old could be old or !old
    var DEFAULT_HASH = "#!confirmed,!noload,!old,!failed,id=,d=,!debug";
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
	    console.log("[HASH] recognize new hash " + that.hash);
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
	that.flags["d"] = resp.timeslot ? resp.timeslot : "";
	// that.flags["4sq"] = resp.foursquare_id ? resp.foursquare_id : "";
	var encoded_hash = _encode_hash();
	console.log("[HASH] set_hash to " + encoded_hash);
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

function TitleEditor() {
    var title = undefined;
    var resize = this.resize = function() {
	var text = $("#timeline-title-input").val();
	text = text.replace(/ /g, 'l');
	console.log("text = (" + text + ")  " + text.length);
	var len = from_text_to_width(text) + 4;
	if (len < 4)
	    len = 4;
	console.log("set title-input width " + len);
	$("#timeline-title-input").width(len + "px");
    }
    var from_text_to_width = this.from_text_to_width = function(text) {
	var obj = $("<div/>").attr("id", "timeline-title-text")
		.text(text).prependTo($("#timeline-title"));
	var w = obj.width();
	obj.detach();
	return w;
    }
    var from_x_to_caret = this.from_x_to_caret = function(x) {
	var text = $("#timeline-title-text").text();
	if (x < 6)
	    return 0;
	for(var n = 1; n <= text.length; n++) {
	    var w  = from_text_to_width(text.slice(0, n));
	    if (w > x)
		return n;
	}
    }
    var turn_on = this.turn_on = function(_event) {
	console.log("[TitleEditor] turning on");
	$("#timeline-title").addClass("editing");
	if (typeof title === "undefined") {
	    title = $("#timeline-title-text").text();
	}
	$("#timeline-title-input").attr("maxlength", "20").val(title);
	resize();
	$("#timeline-title-input").focus();
	$.each($("#timeline-title-input"), function(i, input) {
	    var x = from_x_to_caret(_event.offsetX);
	    input.setSelectionRange(x, x);
	});
    }
    var turn_off = this.turn_off = function() {
	console.log("[TitleEditor] turning off");
	$("#timeline-title").removeClass("editing");
	var new_title = $("#timeline-title-input").val().trim().replace(/  +/g, " ");
	if (title != new_title && new_title.length > 0) {
	    console.log("[TitleEditor] calling server to rename the title");
	    var timeline_id = current_view.get_history_id();
	    lunchere_api.rename_timeline(timeline_id, new_title, function(data) {
		console.log("[TitleEditor] server side renamed");
		console.log(data);
		console.log("[TitleEditor] changing the cookie saved names");
		ck.push_timeline(timeline_id, new_title, NEAR, new Date(), foursquare_recommend_offset);
	    });
	    title = new_title;
	}
	$("#timeline-title-text").text(title);
    }
    var register_events = this.register_events = function() {
	$("#timeline-title-text").click(turn_on);
	$("#timeline-title-input").blur(turn_off);
	var timer = null;
	$("#timeline-title-input").keydown(function(evt) {
	    if (timer)
		clearTimeout(timer);
	    resize();
	    timer = setTimeout(function () {
		resize();
		clearTimeout(timer);
	    }, 0);
	});
	$("#timeline-title-input").keypress(function(evt) {
	    if (evt.charCode == 13) {
		$("#timeline-title-input").blur();
		// turn_off();
		return false;
	    }
	    return true;
	});

    }
    return this;
}

function MainUI() {
    var that = this;
    var enabled_only = this.enabled_only = function(callback) {
	return function (_event) {
	    console.log(_event);
	    if ($(_event.delegateTarget).hasClass("disabled")) {
		debug_obj("_event.delegateTarget is disabled", $(_event.delegateTarget));
		return false;
	    }
	    if (! $(_event.delegateTarget).hasClass("enabled")) {
		debug_obj("_event.delegateTarget is not enabled", $(_event.delegateTarget));
		return false;
	    }
	    return callback(_event);
	}
    }
    var toggle_class = this.toggle_class = function (selector, cssClass) {
	return function (_event) {
	    if ($(selector).hasClass(cssClass)) {
		$(selector).removeClass(cssClass);
	    }
	    else {
		$(selector).addClass(cssClass);
	    }
	}
    }
    var register_enabled_only = this.register_enabled_only = function (selector, func) {
	return $(selector).click(enabled_only(func)).removeClass("disabled").addClass("enabled");
    }
    var init = this.init = function () {
	register_enabled_only("#toggle-info-map", toggle_class("#main-container", "no-info-map"));
	register_enabled_only("#extra-toggle", toggle_class("#main-container", "no-details-buttons"));

	register_enabled_only("#options-yes", current_view.yes_clicked);
	register_enabled_only("#options-no", current_view.no_clicked);
	register_enabled_only("#review-reselect", current_view.no_clicked);
	register_enabled_only("#delete-this-meal", current_view.delete_clicked);
	register_enabled_only("#review-delete-meal", current_view.delete_clicked);
	// register_enabled_only("#timeline-button-left",  current_view.left_clicked);
	// register_enabled_only("#timeline-button-right", current_view.right_clicked);

	register_enabled_only("#big-left-button",  current_view.left_clicked);
	register_enabled_only("#big-right-button", current_view.right_clicked);

	register_enabled_only("#typehere-search", current_view.typehere_search_clicked);

	register_enabled_only(".timeline-div.plus", function() {
	    createmeal();
	    // TODO: use current_view
	});

	register_enabled_only("#review-delete", function() {
	    deletemeal();
	    // TODO: use current_view
	});

	$(window).on("hashchange", function() {
	    current_view.on_hashchange(/* initialize */ false);
	});
    }
    return this;
}

function FoursquareFormatted(venue) {
    var that = this;
    var _format_hours = this._format_hours = function () {
	// e.g.
	// https://developer.foursquare.com/docs/explore#req=venues/4b6f9f3ef964a52036f82ce3

	if (venue.hours && venue.hours.status) {
	    return venue.hours.status;
	}
	else {
	    return "";
	}

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
	var at = " in ";
	$.each(["city", "state", "country", "cc", "postalCode", "lat-lng", "address", "crossStreet"], function(i, key) {
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
    var _format_ll = this._format_ll = function () {
	// Category in Location
	if (venue.location && typeof venue.location.lat === "number"
	                   && typeof venue.location.lng === "number") {
	    // return venue.location;
	    return venue.location.lat + "," + venue.location.lng;
	}
	else {
	    return null;
	}
    }
    var _format_distance = this._format_distance = function () {
	if (venue.location.distance) {
	    return Math.ceil(venue.location.distance / 100) + " min walk"
	}
	else {
	    return "";
	}
    }
    var _show_map = this._show_map = function () {
	// Use Google Maps API to show the location.
    }
    var _format_detailed_addr = this._format_detailed_addr = function () {
	return venue.location.address;
    }
    var _format_detailed_town = this._format_detailed_town = function () {
	var town = "";
	var empty_town = true;
	if (venue.location.crossStreet) {
	    town += "("  + venue.location.crossStreet + ") "
	}
	if (venue.location.city) {
	    town += venue.location.city;
	    empty_town = false;
	}
	if (venue.location.state) {
	    town += (empty_town ? "" : ", ") + venue.location.state;
	}
	else if (venue.location.country) {
	    town += (empty_town ? "" : ", ") + venue.location.country;
	}
	return town;
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
	return "";
    }
    var _format_price = this._format_price = function () {
	if (venue.price && venue.price.tier) {
	    var dollars = ["$", "$", "$", "$"];
	    var tier = venue.price.tier;
	    return "<span class=\"darken\">" + dollars.slice(-tier).join(" ") + "</span> <span class=\"lighten\">" + dollars.slice(tier).join(" ") + "</span>";
	    // e.g.
	    // https://foursquare.com/v/vietnam-village/4a89ad3cf964a520aa0820e3
	}
	else
	    return "";
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
    this.ll = _format_ll();
    this.map = _show_map();
    this.detailed_addr = _format_detailed_addr();
    this.detailed_town = _format_detailed_town();
    this.contact = _format_contact();
    this.apply = apply;
    this.canonicalUrl = _format_canonical_url();
    this.price = _format_price();
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
	    (that.context.timeslot == current_view.get_timeslot() ||
	    current_view.get_timeslot() === null))
	{
	    callback(that.choices);
	    return;
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
    var that = this;
    var FOOD_ID = "4d4b7105d754a06374d81259";
    var that = this;
    var auth = NOLOGIN_SUFFIX; // TODO use this.auth
    var url_field = this.url_field = function (k, v) {
	return encodeURI(k) + "=" + encodeURI(v);
    }
    var category_food_id = this.category_food_id = function () {
	return "categoryId=" + FOOD_ID;
    }
    var search_food = this.search_food = function (q0, done, fail) {
	if (!LL) {
	    console.log("[FoursquareAPI] !LL call fail({}) directly");
	    fail({});
	    return;
	}
	debug_obj("[FoursquareAPI] LL = ", LL);
	var ll = LL;
	var suggestcompletion = "search";
	var url = "https://api.foursquare.com/v2/venues/" + suggestcompletion
	    + "?ll=" + ll
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
	if (cache.hasOwnProperty(q0)) {
	    response_callback(cache[q0]); // TODO: or setTimeout 0?
	    return;
	}
	if (q0.length < 1) {
	    response_callback([]);
	    return;
	}
	var minivenues = "venues"; // instead of "minivenues";
	foursquare_api.search_food(q0,
	    function(data) {
		var a = [];
		$.each(data.response[minivenues], function(i, minivenue) {
		    // because this is minivenue, do not cache?
		    var name = minivenue.name + " @ " + minivenue.location.address;
		    var name_addr = minivenue.name + " @ " + minivenue.location.address
			     + " (" + minivenue.location.distance + "m)";
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
	    }, function(jqXHR) {
		debug_obj("[4SQAutocomple] ERROR " + jqXHR.status
			+ " " + jqXHR.statusText + "; with", jqXHR.responseJSON);
		response_callback([]);
	    });
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
		var len_l = a_lunchere.length;
		var len_f = a_foursquare.length;
		var separator;
		if (len_l == 0 || len_f == 0) {
		    separator = [];
		}
		else {
		    separator = that.separator;
		}
		var a = a_lunchere.slice(0, 5)
			.concat(separator)
			.concat(a_foursquare.slice(0, 5));
		response_callback(a);
	    }
	    else {
		// just ignore it. the newest q0 would call that response.
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
	$("#typehere").focus(function() {
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
    return this;
}

function fake_gapi() {
    var url_prefix = "/_rpc.";
    function create_remote_method(url_suffix, req) {
	function execute(req, callback) {
	    var url = url_prefix + url_suffix;
	    console.log("sending request to " + url);
	    $.ajax({
		type: 'POST',
		contentType: "application/json",
		processData: false,
		data: JSON.stringify(req),
		url: url,
	    }).done(function(data) {
		console.log("done " + data);
		callback(data);
	    }).fail(function(data) {
		console.log("fail " + data);
	    });
	}

	return function(req) {
	    return {
		'execute': function(callback) {
		    execute(req, callback);
		}
	    }
	}
    }
    return {
	'client': {
	    'load': function(api_name, api_version, callback, root) {
		setTimeout(function() {
		    callback('{ "ok": true }');
		}, 0);
	    },
	    'lunchere': {
		'todayUnauth': create_remote_method('today_unauth'),
		'deletemealUnauth': create_remote_method('deletemeal_unauth'),
		'prevmealUnauth': create_remote_method('prevmeal_unauth'),
		'nextmealUnauth': create_remote_method('nextmeal_unauth'),
		'yesUnauth': create_remote_method('yes_unauth'),
		'noUnauth': create_remote_method('no_unauth'),
		'fetchUnauth': create_remote_method('fetch_unauth'),
		'choices': create_remote_method('choices_unauth'),
		'rename_timeline': create_remote_method('rename_timeline'),
	    },
	},
    };
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
	return !! that.gapi && that.loaded && that.gapi.client && that.gapi.client.lunchere;
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
	var callback = function(json_obj) {
	    debug_obj("[LunchereAPI] LunchereAPI.init - " + (apisToLoad - 1) + " APIs to load; with json=", json_obj);
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
	    if (! resp.source ){
		resp.source = "Lunchere";
	    }
	    callback(resp);
	});
    }

    var today = this.today = function (history_id, callback) {
	that.should_reset = true;
	_send_request("today", that.gapi.client.lunchere.todayUnauth, {
	    "historyId": history_id,
	}, callback);
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
    var fetch = this.fetch = function (history_id, timeslot, canteen_id, foursquare_id, callback) {
	_send_request("fetch_meal", that.gapi.client.lunchere.fetchUnauth, {
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
    var rename_timeline = this.rename_timeline = function (history_id, new_name, callback) {
	_send_request("rename_timeline", that.gapi.client.lunchere.rename_timeline, {
	    "timeline_id": history_id,
	    "new_name": new_name,
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

function NewBackend(current_view, lunchereCache, foursquareCache, lunchere_api, lunchere_autocomplete, LL) {
    var that = this;
    var generate_resp_from_venue = this.generate_resp_from_venue = function (venue) {
	// TODO
    }
    /*
    var both_cached_from_ll_near = this.both_cached_from_ll_near = function (ll_near, callback) {
	foursquareCache.fetch_recommendation(ll_near.ll, ll_near.near,
	    function (name, venue) {
		// TODO add to lunchereCache
		lunchereCache.fetch(name, venue.id, callback);
	    });
    }
    */
    var empty_lunch_received = this.empty_lunch_received = function () {
	body_class.refresh();

        console.log("[NewBackend] empty lunch received");
	// two cases come here:
	//     ! resp && !venue
	//     ! resp.name && !venue
	var ll = LL;
	if (ll) {
	    foursquareCache.fetch_recommendation(ll, null,
	        function (name, venue) {
		    lunchereCache.fetch(name, venue.id, function (resp, venue) {
			resp.source = "Foursquare";
			that.receive(resp, venue);
		    });
		}, current_view.history_id);
	}
	else {
	    console.log("[NewBackend] ERROR ll is empty");
	}
    }
    var receive = this.receive = function (resp, venue) {
	// debug_obj("NewBackend.receive with resp =", resp);
	// debug_obj("                       venue =", venue);
	if ((!resp || !resp.name) && venue) {
	    resp = generate_resp_from_venue(venue);
	}
	if (resp && resp.historyId && resp.historyId != current_view.get_history_id()) {
	    current_view.set_history_id(resp.historyId);
	}
	if ((! resp || ! resp.name) && ! venue) {
	    empty_lunch_received();
	}
	else if (resp) {
	    current_view.set_view(resp);
	}
	if (lunchere_api.pop_should_reset())
	    lunchere_autocomplete.reset();
    }
}

function FoursquareCache() {
    var that = this;
    this.cache = {};
    that.cache_enabled = true;
    var fetch = this.fetch = function (id, callback) {
	function callback_wrapper(venue) {
	    console.log("[FoursquareCache] foursquare returns, I hope the title is updated");
	    setTimeout(function() {
		console.log("[FoursquareCache] foursquare returns");
		that.cache[id] = venue;
		callback(venue);
	    }, 0);
	}

	if (that.cache_enabled && that.cache.hasOwnProperty(id)) {
	    callback_wrapper(that.cache[id]);
	}
	else {
	    get_details_from_foursquare(id, callback_wrapper);
	}
    }
    var fetch_recommendation = this.fetch_recommendation = function (ll, near, callback, timeline_id) {
	get_recommendation_from_foursquare(ll, near, function(name, venue) {
	    that.cache[venue.id] = venue;
	    callback(name, venue);
	}, timeline_id);
    }
    var has = this.has = function (id) {
	if (! that.cache_enabled)
	    return false;
	return that.cache.hasOwnProperty(id);
    }
    return this;
}

function LunchereCache(foursquareCache, get_history_id, get_timeslot) {
    var that = this;
    this.cache = null;
    var fetch_4sq = this.fetch_4sq = function (resp, callback_resp_venue) {
	var lunch = resp;
	var canteen_id = resp.name;
	var foursquare_id = resp.foursquare_id;
	that.cache = lunch;
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
	/*
	else {
	    lunch = {
		"historyId": get_history_id(),
		"timeslot": get_timeslot(),
		"name": canteen_id,
		"foursquare_id": foursquare_id,
		"cached": false,
	    };
	    that.cache[canteen_id] = lunch;
	}
	*/
	console.log("LunchereCache.fetch " + canteen_id + " " + foursquare_id);
	var timeslot = get_timeslot();
	var lunchere_venue = null;
	var foursquare_venue = 0;
	var foursquare_called = false;
	function either_callback() {
	    console.log("either_callback");
	    if (lunchere_venue && lunchere_venue.foursquare_id &&
		(!foursquare_id || foursquare_called && lunchere_venue.foursquare_id != foursquare_venue.id) ) {
		// new foursquare_id is got
		foursquare_id = lunchere_venue.foursquare_id;
		foursquare_called = false;
		console.log("foursquare_id changed from zero to " + foursquare_id);
		foursquareCache.fetch(foursquare_id, function(venue) {
		    foursquare_venue = venue;
		    foursquare_called = true;
		    either_callback();
		});
	    }
	    if (lunchere_venue && (!foursquare_id || foursquare_called)) {
		console.log("lunch and foursquare both received: ");
		console.log(lunchere_venue);
		console.log(foursquare_venue);
		callback_resp_venue(lunchere_venue, foursquare_venue);
	    }
	    else {
		console.log("lunchere_venue = " + lunchere_venue);
		console.log("foursquare_id = " + foursquare_id);
		console.log("foursquare_called = " + foursquare_called);
	    }
	}
	if (that.cache && that.cache.name == canteen_id && that.timeslot == timeslot) {
	    lunchere_venue = that.cache;
	    console.log("canteen found in cache");
	    if (lunchere_venue.name != canteen_id) {
		console.log("[CACHE] BUG! lunchere_venue.name != canteen_id");
	    }
	}
	else {
	    console.log("fetching lunch");
	    lunchere_api.fetch(get_history_id(), get_timeslot(), canteen_id, foursquare_id, function(venue) {
		console.log("fetched lunch");
		if (venue.name == canteen_id)
		    that.cache = venue;
		else {
		    console.log("[CACHE] maybe confirmed? BUG canteen_id(" + canteen_id + ") != fetched venue.name (" + venue.name + ")");
		}
		lunchere_venue = venue;
		either_callback();
	    });
	}
	if (foursquare_id) {
	    console.log("fetching foursquare");
	    foursquareCache.fetch(foursquare_id, function(venue) {
		console.log("fetched foursquare");
		foursquare_venue = venue;
		foursquare_called = true;
		either_callback();
	    });
	}
	else {
	    console.log("zero foursquare");
	    either_callback();
	}
    }
    var has_title = this.has_title = function (canteen_id) {
	if (that.cache && that.cache.name == canteen_id) {
	    return true;
	}
	return false;
    }
    var has = this.has = function (canteen_id, foursquare_id) {
	if (that.cache && that.cache.name == canteen_id && !foursquare_id) {
	    foursquare_id = that.cache.foursquare_id;
	}
	if (foursquareCache.has(foursquare_id)) {
		return true;
	}
	return false;
    }
    var add = this.add = function (canteen_id, resp) {
	that.cache = resp;
	if (resp.foursquare_id) {
	    foursquareCache.fetch(resp.foursquare_id, function(venue) { });
	}
    }

    return this;
}

function GoogleDistance() {
    var distance = this.distance = function (origins, destinations, done) {
	// Use of the Distance Matrix API must relate to the display of information on
	// a Google Map; for example, to determine origin-destination pairs that fall
	// within a specific driving time from one another, before requesting and
	// displaying those destinations on a map. Use of the service in an application
	// that doesn't display a Google map is prohibited.
	//
	//
	console.log("[GOOGLE_DISTANCE] " + origins + " to " + destinations);
	var url = "https://maps.googleapis.com/maps/api/distancematrix/json"
	               + "?origins=" + origins
		       + "&destinations=" + destinations
		       + "&language=en-US"
		       + "&sensor=false";
	console.log("[GOOGLE_DISTANCE] url = " + url);
	$.ajax({ "url": url }).done(function (obj) {
	    if (obj.status == "OK") {
		var element = obj.rows[0].elements[0];
		if (element && element.duration && element.duration.text) {
		    var d = element.duration.text + " walk"
		    console.log("[GOOGLE_DISTANCE] distance = " + d);
		    done(d);
		}
		else {
		    console.log("[GOOGLE_DISTANCE] done, OK but coult not parse");
		    console.log(element);
		    done("");
		}
	    }
	    else {
		console.log("[GOOGLE_DISTANCE] done but not OK");
		console.log(obj);
		done("");
	    }
	}).fail(function () {
	    console.log("[GOOGLE_DISTANCE] fail");
	    done("");
	});
    }
}

function TimeslotView(timeslot, mealname, has_nextmeal) {
    var that = this;
    this.timeslot = timeslot;
    if (typeof mealname === 'undefined') {
	mealname = "Lunch";
    }
    this.mealname = mealname;
    var month_name = this.month_name = [
       "Jan", "Feb", "Mar", "Apr",
       "May", "Jun", "Jul", "Aug",
       "Sep", "Oct", "Nov", "Dec",
    ];
    var calc_days_diff = this.calc_days_diff = function () {
	// I do not check the timeslot numbers here,
	// the Date function could convert to some defined date
	var now = new Date();
	var date1 = new Date(now);
	date1.setDate(1);
	date1.setYear(that.yyyy);
	date1.setMonth(that.mm);
	date1.setDate(that.dd);
	that.days_diff = (date1 - now) / (86400 * 1000);
	if (that.days_diff != Math.floor(that.days_diff)) {
	    throw "days_diff should be integer!";
	}
    }
    var format_ordinal=  this.format_ordinal = function (ord) {
	if (ord % 10 == 1 && ord != 11)
	    return "" + ord + "st meal";
	else if (ord % 10 == 2 && ord != 12)
	    return "" + ord + "nd meal";
	else if (ord % 10 == 3 && ord != 13)
	    return "" + ord + "rd meal";
	else
	    return "" + ord + "th meal";
    }
    var break_timeslot = this.break_timeslot = function () {
	that.yyyy = Math.floor(that.timeslot / 1000000);
	that.mm = Math.floor(that.timeslot / 10000) % 100 - 1;
	that.dd = Math.floor(that.timeslot / 100) % 100;
	that.ord = Math.floor(that.timeslot) % 100;
	return that;
    }
    var is_today = this.is_today = function () {
	return (that.days_diff == 0);
    }
    var always_date = this.always_date = function () {
	return "" + that.dd + " " + month_name[that.mm] + " " + that.yyyy;
    }
    var always_humandate = this.always_humandate = function () {
	switch (that.days_diff) {
	    case -1: return "Yesterday";
	    case 0: return "Today";
	    case 1: return "Tomorrow";
	    default: return null;
	}
    }
    var date = this.date = function () {
	var humandate = always_humandate();
	if (! humandate)
	    return always_date();
    }
    var confirmed_mealname = this.confirmed_mealname = function () {
	var humandate = always_humandate();
	if (humandate) {
	    return humandate + "'s " + mealname;
	}
	else {
	    return mealname;
	}
    }
    var present_tense = this.present_tense = function () {
	switch (that.mealname) {
            case "Snack": return "Snack";
            case "Breakfast": return "Breakfast";
            case "Lunch": return "Lunch";
            case "Tea": return "Tea";
	    case "Dinner": return "Dinner";
	    case "Supper": return "Supper";
	    default: "Have a meal";
	}
    }
    var past_tense = this.past_tense = function () {
	switch (that.mealname) {
            case "Snack": return "Snacked";
            case "Breakfast": return "Breakfasted";
            case "Lunch": return "Lunched";
            case "Tea": return "Teaed";
	    case "Dinner": return "Dined";
	    case "Supper": return "Had a supper";
	    default: "Had a meal";
	}
    }
    var question_date = this.question_date = function () {
	switch (that.days_diff) {
	    case -1: return "Yesterday";
	    case 0: return "Today";
	    case 1: return "Tomorrow";
	    default: return "on " + that.dd + " " + month_name[that.mm] + " " + that.yyyy;
	}
    }
    var question_meal = this.question_meal = function () {
	if (that.days_diff >= 0) {
	    var v1_base = "Have meal"; 
	    if (that.ord == 1)
		v1_base = "Lunch";
	    else if (that.ord == 2)
		v1_base = "Dinner";
	}
    }
    var meal = this.meal = function () {
	return format_ordinal(that.ord);
    }
    var apply = this.apply = function (s1, s2, s3, s4) {
	// selectors: s1, s2, s3
	// s1: // if Today or Future dates.
	//     Lunch here Today?
	//     Lunch here Tomorrow?
	//     Lunch here 24 Jul?
	//     Lunch here Wednesday?
	//     Dinner here XXX?
	//     Have a meal here YYY?
	//     // or else
	//     Have a meal here?
	// s2: // Only the above does not show the info.
	//     1st meal on 12 Jul 2013
	// s3: // Confirmed
	//     Wednesday's Lunch
	//     Today's Dinner
	// s4: // Only the above does not show the info.
	//     1st meal on 12 Jul 2013
	var v1, v2, v3;
	if (! has_nextmeal) { // that.days_diff >= 0) {
	    v1 = present_tense() + " here " + question_date() + "?";
	}
	else {
	    v1 = past_tense() + " here " + question_date() + "?";
	}
	v2 = format_ordinal(that.ord) + " on " + always_date();
	v3 = confirmed_mealname();
	v4 = format_ordinal(that.ord) + " on " + always_date();
	console.log("[TimeslotView] v1 = " + v1);
	console.log("[TimeslotView] v2 = " + v2);
	console.log("[TimeslotView] v3 = " + v3);
	console.log("[TimeslotView] v4 = " + v4);
	$(s1).text(v1);
	$(s2).text(v2);
	$(s3).text(v3);
	$(s4).text(v4);
    }
    break_timeslot();
    calc_days_diff();
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
    var set_timeslot = this.set_timeslot = function (timeslot) {
	if (!timeslot)
	    that.timeslot = null;
	else
	    that.timeslot = parseInt(timeslot);
    }
    var get_canteen_id = this.get_canteen_id = function () {
	return that.canteen_id;
    }
    var set_canteen_id = this.set_canteen_id = function (new_canteen_id) {
	return that.canteen_id = new_canteen_id;
    }
    var pop_canteen_id = this.pop_canteen_id = function (){
	var old_canteen_id = get_canteen_id();
	set_canteen_id("");
	return old_canteen_id;
    }
    var get_foursquare_id = this.get_foursquare_id = function () {
	return that.foursquare_id;
    }
    var set_foursquare_id = this.set_foursquare_id = function (new_foursquare_id) {
	return that.foursquare_id = new_foursquare_id;
    }
    var pop_foursquare_id = this.pop_foursquare_id = function (){
	var old_foursquare_id = get_foursquare_id();
	set_foursquare_id("");
	return old_foursquare_id;
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
	    return "you";
    }
    var button_4sq_clicked = function (_event) {
	var target = _event.delegateTarget;
	if ($(target).hasClass("enabled")) {
	    return true;
	}
	else {
	    return false;
	}
    }
    var format_venue = this.format_venue = function (resp, venue) {
	if (!venue) {
	    console.log("venue is empty");
	    return;
	}
	if (venue.id != resp.foursquare_id) {
	    console.log("WARNING venue.id != resp.foursquare_id")
	    return;
	}

	resp.foursquare_venue = venue;

	var formatted = new FoursquareFormatted(venue);
	var view = {
	    // "name": "#title-text", // name could be customized
	    "addr": "#title-addr",
	    "price": function (price_html) {
		$("#costs").html(price_html);
	    },
	    "distance": "#distance",
	    "detailed_addr": "#details-addr",
	    "detailed_town": "#details-town",
	    "contact": "#details-phonenumber",
	    "icon": function(icon_url) {
		console.log("[APPLY] apply " + icon_url + " to #main-icon's background-image");
		console.log(icon_url);
		$("#main-icon").css({ "background-image": "url(" + icon_url + ")" });
		return "main-icon";
	    },
	    "canonicalUrl": function(link_url) {
		if (link_url) {
		    $("#buttons-3").attr("href", link_url).addClass("enabled").removeClass("disabled").click(button_4sq_clicked);
		}
		else {
		    $("#buttons-3").attr("href", link_url).removeClass("enabled").addClass("disabled");
		}
		return "#external-link";
	    },
	    "hours": "#details-hours",
	    "ll": function (ll) {
		// TODO: call google maps to draw the map.
	    }
	};
	that.view_cached = view;
	that.formatted_cached = formatted;
	formatted.apply(view);

	var toggler = new ClassToggler({
	    "#main-container": {
		"mapping": {
		    "f4sq-no-icon":     ! formatted.icon,
		    "f4sq-no-ratings":  true,
		    "f4sq-no-addr":     ! formatted.addr,
		    "f4sq-no-details-addr":     ! formatted.detailed_addr,
		    "f4sq-no-details-town":     ! formatted.detailed_town,
		    "f4sq-no-price":    ! formatted.price,
		    "f4sq-no-ll":	! formatted.ll,
		    "f4sq-no-contact":  ! formatted.contact,
		    "f4sq-no-hours":    ! formatted.hours,
		    "f4sq-no-url":      ! formatted.canonicalUrl,
		}
	    }
	});
	toggler.apply();


	if (! formatted.distance && formatted.ll) {
	    google_distance.distance(LL, formatted.ll, function (distance) {
		    formatted.distance = distance;
		    $("#distance").text(distance);
		    new ClassToggler({
			"#main-container": {
			    "mapping": {
				"f4sq-no-distance": ! formatted.distance,
			    }
			}
		    }).apply();
		});
	}
	else {
	    new ClassToggler({
		"#main-container": {
		    "mapping": {
			"f4sq-no-distance": ! formatted.distance,
		    }
		}
	    }).apply();
	}

	body_class.refresh();
    }
    var set_prev_button = this.set_prev_button = function (has_prevmeal) {
	var descriptor =  {
	    /*
	    "#timeline-button-left": {
		"mapping": {
		    "disabled": ! has_prevmeal,
		    "enabled": has_prevmeal,
		}
	    },
	    "#timeline-button-left > i": {
		"mapping": {
		    "icon-arrow-left": has_prevmeal,
		}
	    },
	    */
	    "#big-left-button": {
		"mapping": {
		    "disabled": ! has_prevmeal,
		    "enabled": has_prevmeal,
		    "icon-arrow-left": has_prevmeal,
		}
	    }
	};
	console.log(descriptor);
	var toggler = new ClassToggler(descriptor);
	toggler.apply();
    }
    var set_next_button = this.set_next_button = function (has_nextmeal, has_createmeal, confirmed) {
	if (! has_nextmeal && !has_createmeal && confirmed) {
	    // FIXME: this should be fixed in the server.
	    //        It seems the server has already fixed this.
	    console.log("BUG: ! has_nextmeal && !has_createmeal && confirmed; fixed in js but should be fixed in the server");
	    has_createmeal = true;
	}
	// FIXME: Currently the server will return has_createmeal = false when a meal is
	//        newly confirmed, this could be temporarily solved by refreshing the page...
	var descriptor =  {
	    /*
	    "#timeline-button-right": {
		"mapping": {
		    "disabled": ! (has_nextmeal || has_createmeal),
		    "enabled": has_nextmeal || has_createmeal,
		}
	    },
	    "#timeline-button-right > i": {
		"mapping": {
		    "icon-arrow-right": has_nextmeal,
		    "icon-plus": has_createmeal && !has_nextmeal,
		}
	    },
	    */
	    "#big-right-button": {
		"mapping": {
		    "disabled": ! (has_nextmeal || has_createmeal),
		    "enabled": has_nextmeal || has_createmeal,
		    "icon-arrow-right": has_nextmeal,
		    "icon-plus": has_createmeal && !has_nextmeal,
		}
	    }
	};
	console.log(descriptor);
	var toggler = new ClassToggler(descriptor);
	toggler.apply();
    }
    var clear_typehere = this.clear_typehere = function () {
	$("#typehere").val("");
	$("#typehere")[0].hidden_field = null;
	$("#typehere-search").addClass("disabled").removeClass("enabled");
    }
    var set_title_multilang = this.set_title_multilang = function($title_text, name) {
	var english_start = -1;
	var other_lang_start = -1;
	var mixed = false;
	for (var i = 0; i < name.length; i++) {
	    if ('A'.charCodeAt(0) <= name.charCodeAt(i) && name.charCodeAt(i) <= 'z'.charCodeAt(0) ||
		'a'.charCodeAt(0) <= name.charCodeAt(i) && name.charCodeAt(i) <= 'z'.charCodeAt(0)) {
		if (english_start < 0)
		    english_start = i;
		else if (english_start < other_lang_start)
		    mixed = true;
	    }
	    if (name.charCodeAt(i) >= 256) {
		if (other_lang_start < 0)
		    other_lang_start = i;
		else if (other_lang_start < english_start)
		    mixed = true;
	    }
	}
	if (mixed)
	    return $title_text;
	var a = "";
	var b = "";
	if (english_start >= 0 && english_start < other_lang_start) {
	    while(name.charAt(other_lang_start - 1) == '(' ||
		    name.charAt(other_lang_start - 1) == '[' ||
		    name.charAt(other_lang_start - 1) == '{') {
		other_lang_start --;
	    }
	    a = name.slice(0, other_lang_start);
	    a = a.replace(/[ |-]*$/, '');
	    b = name.slice(other_lang_start);
	}
	else if (other_lang_start >= 0 && other_lang_start < english_start) {
	    while(name.charAt(english_start - 1) == '(' ||
		    name.charAt(english_start - 1) == '[' ||
		    name.charAt(english_start - 1) == '{') {
		english_start --;
	    }
	    a = name.slice(0, english_start);
	    a = a.replace(/[ |-]*$/, '');
	    b = name.slice(english_start);
	}
	else return $title_text.text(name);

        $title_text.text(a).append($("<br>")).append(document.createTextNode(b));
	var double_line_height = 72;
	if ($title_text.height() > double_line_height) {
	    $title_text.text(name);
	}
	return $title_text;
    }
    var test_set_title = this.test_set_title = function () {
	var i = 0;
	var old = $("#title-text").text();
	var a = [
	    "Fairwood (商业中心)",
	    "Fairwood fast food (商业中心)",
	    "Fairwood fast food restaurant (商业中心)",
	    "(商业中心) Fairwood ",
	    "(商业中心) Fairwood fast food ",
	    "(商业中心) Fairwood fast food restaurant ",
	    "Zööba | زووبة",
	    "زينب خاتون",
	    "Bijas 一念素食",
	    "Yuen Kee Dessert 源記甜品專家",
	    "Café Malacca 馬來一菜館",
	    "Kwan Kee Claypot Rice 坤記煲仔小菜",
	    "Macau Restaurant 澳門茶餐廳",
	    "Honeymoon Dessert 滿記甜品",
	    "Shung Hing Chiu Chow Seafood Restaurant 尚興潮州飯店",
	    "花马天堂云南餐厅 | Lost Heaven Yunnan Restaurant",
	    "鼎泰豐 | Din Tai Fung",
	    "滴水洞 | Di Shui Dong",
	    "Maya Mexican Restaurant | 玛雅",
	    "Boxing Cat Brewery | 拳击猫餐厅",

	];
	var n = a.length;
	var repeat = function() {
	    if (i != n) {
		console.log("set_title(\"" + a[i] + "\")");
		set_title($("#title-text"), a[i]);
		i = i + 1;
		setTimeout(repeat, 2000);
	    }
	    else {
		set_title($("#title-text"), old);
	    }
	};
	repeat();
    }
    var set_title = this.set_title = function ($title_text, name) {
	$title_text.removeClass("single-line");

	$title_text.text(name);
        var height = $title_text.height();
	var double_line_height = 72;
	var single_line_height = 36;

	if (height > single_line_height) {
	    $title_text = set_title_multilang($title_text, name);
	}

	height = $title_text.height();
	if (height <= single_line_height) {
	    $title_text.addClass("single-line");
	}
	return $title_text;
    }
    var set_view = this.set_view = function (resp) {
	// debug_obj("this.set_view with resp = ", resp);
	that.resp_cache = resp;
	// it should contains historyId, timeslot, name, and foursquare_id
	hashurl.set_hash(resp);
	set_title($("#title-text"), resp.name);
	$("#title-source").text(get_resp_source(resp));
	$("#recommendation-source").text(get_resp_source(resp));
	clear_typehere();
	$("#confirmed-info-name").text("...");

	// $("#confirmed-info-date").text(resp.timeslotFriendly);
	// $("#no-confirmed-info-date").text(resp.timeslotFriendly);
	var timeslotView = new TimeslotView(resp.timeslot, resp.mealname, resp.has_nextmeal);
	timeslotView.apply(
	    "#no-confirmed-info-question",
	    "#no-confirmed-info-date",
	    "#confirmed-info-name",
	    "#confirmed-info-date");
	that.set_prev_button(resp.has_prevmeal);
	that.set_next_button(resp.has_nextmeal, resp.has_createmeal, resp.confirmed);
	that.history_id = resp.historyId;
	that.timeslot = resp.timeslot;
	that.set_canteen_id(resp.name);
	that.set_foursquare_id(resp.foursquare_id);
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
	    "timeslot": that.get_timeslot(),
	    "name": canteen_id,
	    "foursquare_id": foursquare_id,
	});
	set_title($("#title-text"), canteen_id);
	$("#title-source").text("you");
	clear_typehere();
	$("#recommendation-source").text("you");
	that.set_canteen_id(canteen_id);
	that.set_foursquare_id(foursquare_id);
	that.confirmed = false;

	body_class.refresh();
	lunchereCache.fetch(canteen_id, foursquare_id, new_backend.receive);
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
    var initialized = false;
    var on_hashchange = this.on_hashchange = function (initialize) {
	if (!initialized && !initialize) {
	    console.log("[HASH] do not proceed on_hashchange until initialzied");
	    return;
	}
	// detech what is changed.
	hashurl.recognize_new_hash();
	// hashurl has already normalized them.
	if ((initialize && !initialized) ||
	    hashurl.get_flag("id") != normalize(this.canteen_id) ||
	    hashurl.get_flag("d") != normalize(this.timeslot)) {

	    initialized = true;

            // changed.
	    console.log("[HASH] hash changed from "
		    + hashurl.get_flag("id") + "/" + hashurl.get_flag("d") + " to "
		    + normalize(this.canteen_id) + "/" + normalize(this.timeslot));
	    that.on_hashchange_callback();

	    this.set_canteen_id(hashurl.get_flag("id"));
	    this.set_timeslot(hashurl.get_flag("d"));

	    if (this.canteen_id == "") {
		console.log("[HASH] both id empty, calls the lunchere today api");
		lunchere_api.today(historyId, /* global historyId */
		    new_backend.receive);
	    }
	    else {
		console.log("[HASH] either id not empty, ask the use yes/no");
		lunchereCache.fetch(hashurl.get_flag("id"),
		    null,
		    new_backend.receive);
	    }
	}
	else {
	    // no changes
	    console.log("[HASH] no changes");
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
	lunchere_api.cancel_meal(
	    get_history_id(),
	    get_timeslot(),
	    pop_canteen_id(),
	    pop_foursquare_id(),
	    function (resp) {
		that.set_canteen_id(resp.name);
		new_backend.receive(resp, null);
	    }
	    );
    }
    var delete_clicked = this.delete_clicked = function () {
	body_class.refresh();
	pop_canteen_id();
	pop_foursquare_id();
	lunchere_api.delete_meal(
	    get_history_id(),
	    get_timeslot(),
	    function (resp) {
		that.timeslot = resp.timeslot;
		that.set_canteen_id(resp.name);
		that.foursquare_id = resp.foursquare_id;
		new_backend.receive(resp, null);
	    });
    }
    var left_clicked = this.left_clicked = function (){
	body_class.refresh();
	pop_canteen_id();
	pop_foursquare_id();
	lunchere_api.prev_meal(
	    get_history_id(),
	    get_timeslot(),
	    function (resp) {
		that.timeslot = resp.timeslot;
		that.set_canteen_id(resp.name);
		that.foursquare_id = resp.foursquare_id;
		new_backend.receive(resp, null);
	    });
    }
    var right_clicked = this.right_clicked = function () {
	body_class.refresh();
	pop_canteen_id();
	pop_foursquare_id();
	lunchere_api.next_meal( /* TODO if next_meal != create_meal */
	    get_history_id(),
	    get_timeslot(),
	    function (resp) {
		that.timeslot = resp.timeslot;
		that.set_canteen_id(resp.name);
		that.foursquare_id = resp.foursquare_id;
		new_backend.receive(resp, null);
	    });
    }
    var typehere_search_clicked = this.typehere_search_clicked = function() {
	var obj = $("#typehere")[0].hidden_field;
	if (obj) {
	    that.set_ids(obj.canteen_id, obj.foursquare_id);
	}
    }
    var refreshing = this.refreshing = function (on, previous) {
	// do nothing, move the css to hide the info-map and details back
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
var lunchere_autocomplete = new LunchereAutocomplete(current_view, lunchere_api);
var foursquare_api = new FoursquareAPI(NOLOGIN_SUFFIX, LL);
var foursquare_autocomplete = new FoursquareAutocomplete(foursquare_api);
var autocomplete = new Autocomplete(lunchere_autocomplete, foursquare_autocomplete);
var body_class = new BodyClass(current_view, hashurl, loading_spinners, autocomplete);
var new_backend = new NewBackend(current_view, lunchereCache, foursquareCache, lunchere_api, lunchere_autocomplete, LL);
var google_distance = new GoogleDistance();
var title_editor = new TitleEditor();

current_view.on_status_change = function() {
    body_class.refresh();
}
current_view.on_hashchange_callback = function() {
    body_class.refresh();
}
autocomplete.on_select = function(_event, ui) {
    if (ui.item.type == "foursquare") {
	$("#typehere")[0].hidden_field = {
	    "canteen_id": ui.item.obj.name,
	    "foursquare_id": ui.item.obj.id,
	};
	$("#typehere-search").addClass("enabled").removeClass("disabled");
    }
    else if (ui.item.type == "lunchere") {
	$("#typehere")[0].hidden_field = {
	    "canteen_id": ui.item.obj.canteen_id,
	    "foursquare_id": ui.item.obj.foursquare_id,
	};
	$("#typehere-search").addClass("enabled").removeClass("disabled");
    }
    else {
	_event.preventDefault();
    }
    /*
    if (ui.item.type == "foursquare") {
	console.log("on_select with item =");
	console.log(ui.item);
	$("#typehere").val(ui.item.obj.name).blur();
	debug_obj("set_ids with name =", ui.item.obj.name);
	debug_obj("set_ids with 4sq_id =", ui.item.obj.id);
	current_view.set_ids(ui.item.obj.name, ui.item.obj.id);
	_event.preventDefault();
    }
    else if (ui.item.type == "lunchere") {
	console.log("on_select with item =");
	console.log(ui.item);
	$("#typehere").val(ui.item.value).blur();
	debug_obj("set_ids with name =", ui.item.obj.canteen_id);
	debug_obj("set_ids with 4sq_id =", ui.item.obj.foursquare_id);
	current_view.set_ids(ui.item.obj.canteen_id, ui.item.obj.foursquare_id);
	_event.preventDefault();
    }
    else {
	_event.preventDefault();
    }
    */
}

var main_ui_to_load = false;
lunchere_api.on_load = function () {
    if (main_ui_to_load) {
	console.log("[PROGRESS] current_view.on_hashchange() (from LunchereAPI.on_load)");
	current_view.on_hashchange(/* initialize */ true);
    }
}

function gapi_ready() {
    var gapi = fake_gapi();
    lunchere_api.gapi_ready(gapi);
}
$(document).ready(function() {
    console.log("[PROGRESS] document ready");
    console.log("[PROGRESS] autocomplete bind_ui");
    autocomplete.bind_ui();
    title_editor.register_events();
    console.log("[PROGRESS] mainUI init");
    mainUI.init();
    if (lunchere_api.is_ready()) {
	console.log("[PROGRESS] current_view.on_hashchange() (from document ready)");
	current_view.on_hashchange(/* initialize */ true);
    }
    else {
	console.log("[PROGRESS] current_view.on_hashchange() delayed because lunchere_api is not ready");
	main_ui_to_load = true;
    }

    gapi_ready();
});

