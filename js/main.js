
window.addEventListener("load", function load() {
    disable_all();

    console.log("window.load");
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


$(document).ready(function() {
    return;
    set_default_LL();

    var lunchere_autocomplete = [];
    function reload_autocomplete_from_lunchere(callback) {
        if (lunchere_autocomplete && ! autocomplete_should_reload ||
            ! today_recommendation || !today_recommendation.historyId || !today_recommendation.timeslot) {

            callback(lunchere_autocomplete);
            return;
        }
        gapi.client.lunchere.choices({
            'historyId': today_recommendation.historyId,
            'timeslot': today_recommendation.timeslot
        }).execute(function (resp) {
            if (! resp.choices)
                resp.choices = [];
            lunchere_autocomplete = resp.choices;
            console.log("resp");
            console.log(resp);

            callback(resp.choices);
        });
    }

    var cached_source = {};
    function dynamic_source(request, response) {
        var q0 = request.term;
        var q = encodeURI(q0);
        var a_lunchere;
        var a_foursquare;
	if (q0 == cached_source.q0) {
	    response(cached_source.source);
	}
        function callback_both() {
            if (a_lunchere && a_foursquare) {
		var source = a_lunchere.concat([{
                    "label": "-----------",
                    "value": "-----------",
                    "type": "separator",
                }]).concat(a_foursquare);
                response(source);
		if (cached_source.q0 != q0) {
		    cached_source.q0 = q0;
		    cached_source.source = source;
		}
            }
        }
        function callback_lunchere(data) {
            function escape(q0) {
                var x = "";
                for (var i = 0; i < q0.length; i++) {
                    var ch = $.ui.autocomplete.escapeRegex(q0.charAt(i));
                    x += ch + ".*";
                }
                return x;
            }
            console.log("querystring = " + escape(q0));
            var q0exp = RegExp(escape(q0), "i");
            a_lunchere = [];
            console.log(data);
            for(var i = 0; i < data.length; i++) {
                if (q0exp.test(data[i].canteenId)) {
                    a_lunchere.push({
                        "label": data[i].canteenId,
                        "value": data[i].canteenId,
                        "type": "lunchere",
                        "obj": data[i]
                    });
                }
            }

            callback_both();
        }
        var suggestcompletion = "search"; // instead of suggestCompletion, because the latter failed to restrict in radius
        var minivenues = "venues"; // instead of "minivenues";
        var AND_FOOD_ID = "&categoryId=" + FOOD_ID; // instead of ""
        function callback_foursquare(data) {
            console.log(data);
            console.log(data.response);
            console.log(data.response[minivenues].length + " suggestions for q0=" + q0);
            a_foursquare = [];
            $.each(data.response[minivenues], function(i, minivenue) {
                var name = minivenue.name + " @ " + minivenue.location.address;
                var name_addr = minivenue.name + " @ " + minivenue.location.address + " (" + minivenue.location.distance + "m)";
                console.log(name_addr);
                var is_food = false;
                $.each(minivenue.categories, function(j, category) {
                    var prefix = category.icon.prefix;
                    if (! prefix)
                        prefix = category.icon;
                    if (/\/food\//.test(prefix)) {
                        is_food = true;
                    }
                    else {
                        console.log(name + " is not food");
                    }
                });
                if (is_food && a_foursquare.indexOf(name) < 0)
                    a_foursquare.push({
                        "label": name,
                        "value": name,
                        "type": "foursquare",
                        "obj": minivenue
                    });
            });
            callback_both();
        }
        var empty_foursquare = {'response': {  } };
        empty_foursquare.response[minivenues] = [];
        if (q0.length >= 1) {
            $.ajax({
                url: "https://api.foursquare.com/v2/venues/" + suggestcompletion + "?" + LL + AND_FOOD_ID + "&radius=1000&limit=10&query=" + q + "&" + NOLOGIN_SUFFIX
            }).done(callback_foursquare).fail(function() {
                console.log("ERROR");
                callback_foursquare(empty_foursquare);
            });
        }
        else {
            callback_foursquare(empty_foursquare);
        }
        reload_autocomplete_from_lunchere(callback_lunchere);
    }

    function dynamic_source_select(_event, ui) {
        if (ui.item.type == "foursquare") {
            console.log("foursquare");
            $("#typehere").val(ui.item.obj.name);
            $("#newplace").val(ui.item.obj.name);
            $("#addr").val(ui.item.obj.location.address);
            _event.preventDefault();
        }
        else if (ui.item.type == "lunchere") {
            console.log("lunchere");
            $("#typehere").val(ui.item.value);
            $("#newplace").val(ui.item.value);
            $("#addr").val("");
            _event.preventDefault();
        }
        else {
            _event.preventDefault();
        }
    }

    function dynamic_source_select_new_UI(_event, ui) {
	dynamic_source_select(_event, ui);
	if (ui.item.type == "foursquare") {
	    console.log(ui.item.obj);
	    if (!today_recommendation || ui.item.obj.id != today_recommendation.foursquare_id) {
		foursquareCache.fetch(ui.item.obj.id, function(venue) {
		    backend.foursquare_received(today_recommendation, ui.item.obj.name, venue);
		});
	    }
	}
	else if (ui.item.type == "lunchere") {
	    console.log(ui.item.obj);
	    if (!today_recommendation ||
		     ui.item.obj.foursquareId != today_recommendation.foursquare_id ||
		     ui.item.value != today_recommendation.name) {
		lunchereCache.fetch(ui.item.value, ui.item.obj.foursquareId, function(resp, venue) {
		    today_recommendation_received(resp, venue);
		});
	    }
	}
    }

    $("#newplace").focus(function() {
        $("#newplace").autocomplete("search");
    });

    $("#newplace").autocomplete({
        source: dynamic_source,
        minLength: 0,
        select: dynamic_source_select,
    });

    $("#typehere").focus(function() {
	if ($("#typehere").val() == "type here" && $("#typehere").attr("valuesource") == "type here") {
	    $("#typehere").val("");
	}
        $("#typehere").autocomplete("search");
    });

    $("#typehere").autocomplete({
        source: dynamic_source,
	delay: 200,
        minLength: 0,
        select: dynamic_source_select_new_UI,
    });
});

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
    var loading_callback = this.loading_callback = function(on) {
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
	    "refreshing": current_view.loading_details,
	    "api-loading": lunchere_api.api_loading,
	};
	console.log("BodyClass.refresh with mapping = ");
	console.log(mapping);
	var callbacks = {
	    "loading": loading_spinners.loading_callback,
	};
	var $body = $("body");
	$.each(mapping, function (cssClass, bool_func) {
	    var on = bool_func();
	    console.log("    - " + cssClass + " : " + (on ? "1" : "0"));
	    if (on) {
		$body.addClass(cssClass);
	    }
	    else {
		$body.removeClass(cssClass);
	    }
	    if (callbacks[cssClass]) {
		callbacks[cssClass](on);
	    }
	});
    }
    return this;
}
function HashURL() {
    // Hash could be changed to a list of flags, a dict!
    // status could be toload, loading, confirmed
    // noload could be noload or !noload
    // old could be old or !old
    var DEFAULT_HASH = "#!confirmed,!noload,!old,!failed,id=,4sq=";
    var that = this;
    this.flags = {};
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
	if (not_equal(that.flags, new_flags)) {
	    that.flags = new_flags;
	    that.hash = document.location.hash;
	    changed = true;
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
    var set_hash = this.set_hash = function (resp) {
	that.flags["id"] = resp.name ? resp.name : "";
	that.flags["4sq"] = resp.foursquare_id ? resp.foursquare_id : "";
	document.location.hash = that.hash = _encode_hash();
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
	});

	$("#options-yes").click(current_view.yes_clicked);

	$("#options-no").click(current_view.no_clicked);

	$("#cancel-button").click(current_view.no_clicked);

	$(".timeline-div.plus").click(function() {
	    createmeal();
	    // use current_view
	});

	$("#review-delete").click(function() {
	    deletemeal();
	    // use current_view
	});

	$(window).on("hashchange", function() {
	    current_view.on_hashchange();
	});
    }
    var goto_hash = this.goto_hash = function () {
	var hash_changed = hashurl.recognize_new_hash();
	if (hash_changed) {
	    console.log("hash_changed by user");
	    lunchereCache.fetch(
	        hashurl.get_flag("id"),
	        hashurl.get_flag("4sq"),
		function(resp, venue) {
		    console.log("goto_hash calling new_backend.receive");

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
	console.log("FoursquareFormatted.apply with mapping =");
	console.log(mapping);
	console.log("                               this =");
	console.log(that);
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
                if (q0exp.test(obj.canteenId)) {
                    a.push({
                        "label": obj.canteenId,
                        "value": obj.canteenId,
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
	});

	$("#typehere").autocomplete({
	    source: that.reload,
	    delay: 200,
	    minLength: 0,
	    select: that.on_select,
	});
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
    var api_loading = this.api_loading = function () {
	return ! that.loaded;
    }
    var old_init = this.old_init = function () {
	init(function() {
	    that.lunchere = that.gapi.client.lunchere;
	    that.loaded = true;
	    console.log("LunchereAPI loaded");

	    body_class.refresh();
	}, function() {
	    console.log("failed");
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
	    console.log("LunchereAPI.init - " + (apisToLoad - 1) + " APIs to load");
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
	console.log("NewBackend.receive with resp =");
	console.log(resp);
	console.log("                        venue =");
	console.log(venue);
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

function Backend() {
    // var historyId;
    // var today_recommendation;
    // var autocomplete_should_reload;
    var foursquare_details_received = this.foursquare_details_received = function (resp, venue) {
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
		console.log(icon_url);
		$("#main-icon > img").attr("src", icon_url);
		return "main-icon";
	    },
	    "canonicalUrl": function(link_url) {
		$("#external-link > a").attr("href", link_url);
		return "#external-link";
	    },
	};
	formatted.apply(view);
    }
    var foursquare_received = this.foursquare_received = function (resp, name, venue) {
	/* venue is defined in https://developer.foursquare.com/docs/responses/venue
	 * as compact venue,
	 * more detailed information could be fetched by calling the single venue request
	 */
	resp.name = name;                // today_recommendation would be the same object.
	resp.has_other_recommend = true; // via foursquare
	resp.foursquare_id = venue.id;
	resp.source = " (4sq)";

	$("#title-text").text(name);
	$("#title-source").text(resp.source);
	foursquare_details_received(resp, venue);
	hashurl.goes_to_normal(name, venue.id);
    }
    var today_recommendation_received_new_ui = this.today_recommendation_received_new_ui = function (resp, venue) {
	console.log("new UI");
	console.log(resp);

	if (resp.historyId && resp.historyId != current_view.get_history_id()) {
	    current_view.set_history_id(resp.historyId);
	}
	if (! resp.name) {
	    hashurl.goes_to_loading("", "");
	    if (resp && resp.hints && resp.hints.ll)
		console.log("resp.hints.ll = " + resp.hints.ll);
	    if (! venue && resp.hints && (resp.hints.ll || resp.hints.near)) {
		foursquareCache.fetch_recommendation(resp.hints.ll, resp.hints.near,
		    function(name, venue) {
			foursquare_received(resp, name, venue);
		    });
	    }
	    else {
		hashurl.goes_to_loading("", "");
		if (navigator && navigator.geolocation) {
		    navigator.geolocation.getCurrentPosition(function(position) {
			resp.hints = {}
			resp.hints.ll = position.coords.latitude + "," + position.coords.longitude;
			today_recommendation_received(resp);
			return;
		    },
		    function () {
			hashurl.goes_to_failed();
		    });
		}
	    }
	}
	else {
	    $("#title-source").text(" (lunchere)");
	    $("#title-text").text(resp.name);
	    var foursquare_id = resp.foursquare_id;
	    if (!foursquare_id && venue)
		foursquare_id = venue.id;
	    if (!foursquare_id)
		foursquare_id = "";
	    if (resp.confirmed) {
		hashurl.goes_to_confirmed(resp.name, foursquare_id);
	    }
	    else {
		hashurl.goes_to_normal(resp.name, foursquare_id);
	    }
	}
	if (venue) {
	    foursquare_details_received(resp, venue);
	    hashurl.goes_to_normal(resp.name, venue.id);
	}
	if (resp && resp.foursquare_id &&
		(!today_recommendation || resp.foursquare_id != today_recommendation.foursquare_id) &&
		!resp.foursquare_venue && ! venue) {
	    foursquareCache.fetch(resp.foursquare_id, function(venue) {
		foursquare_details_received(resp, venue);
		hashurl.goes_to_normal(resp.name, venue.id);
	    });
	}
	// document.getElementById("historyId").innerHTML = historyId;
	// document.getElementById("timeslot").innerHTML = resp.timeslotFriendly;
	// document.getElementById("deletemeal").disabled = ! resp.could_delete;
	// document.getElementById("prevmeal").disabled = ! resp.has_prevmeal;
	// document.getElementById("nextmeal").disabled = ! resp.has_nextmeal;
	// document.getElementById("createmeal").disabled = ! resp.has_createmeal;
	today_recommendation = resp;
	autocomplete_should_reload = true;
    }

    this.foursquare_received = foursquare_received;
    this.today_recommendation_received_new_ui = today_recommendation_received_new_ui;
    return this;
}

function FoursquareCache() {
    var that = this;
    this.cache = {};
    var fetch = this.fetch = function (id, callback) {
	get_details_from_foursquare(id, function(venue) {
	    console.log("foursquare returns, I hope the title is updated");
	    setTimeout(function() {
		console.log("foursquare returns");
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
	var lunch = {
	    "historyId": resp.historyId,
	    "timeslot": resp.timeslot,
	    "name": resp.name,
	    "foursquare_id": resp.foursquare_id,
	};
	that.cache[canteen_id] = lunch;
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
		console.log(icon_url);
		$("#main-icon > img").attr("src", icon_url);
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
	// it should contains historyId, timeslot, name, and foursquare_id
	hashurl.set_hash(resp);
	$("#title-text").text(resp.name);
	$("#title-source").text(get_resp_source(resp));
	that.history_id = resp.historyId;
	that.timeslot = resp.timeslot;
	that.canteen_id = resp.name;
	that.foursquare_id = resp.foursquare_id;
	that.confirmed = resp.confirmed;

	if (resp.foursquare_id) {
	    body_class.refresh();
	    lunchereCache.fetch(resp.name, resp.foursquare_id, format_venue);
	}
	else {
	    body_class.refresh();
	}
    }
    var loading_title = this.loading_title = function () {
	if (that.canteen_id == "" || !lunchereCache.has_title(that.canteen_id)) {
	    console.log("loading_title = true");
	    return true;
	}
	else {
	    console.log("loading_title = false");
	    return false;
	}
    }
    var loading_details = this.loading_details = function () {
	return (that.foursquare_id == "" || !foursquareCache.has(that.foursquare_id));
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
    var on_hashchange = this.on_hashchange = function () {
	// detech what is changed.
	hashurl.recognize_new_hash();
	if (hashurl.get_flag("id") != this.canteen_id ||
	    hashurl.get_flag("4sq") != this.foursquare_id) {

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
    this.yes_clicked = yes_clicked;
    this.no_clicked = no_clicked;
    return this;
}

var geo_api = new GeoAPI();
var lunchere_api = new LunchereAPI();
var mainUI = new MainUI();
var hashurl = new HashURL();
var backend = new Backend();
var today_recommendation_received_new_ui = function() {
    // backend.today_recommendation_received_new_ui;
    alert("ERROR today_recommendation_received_new_ui is called");
}
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

$(document).ready(function() {
    autocomplete.bind_ui();
    mainUI.init();
    mainUI.goto_hash();
});

function gapi_ready() {
    lunchere_api.gapi_ready(gapi);
}
