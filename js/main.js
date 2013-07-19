
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
	confirm_today(get_today_recommendation_name());
    });
    document.getElementById("no").addEventListener("click", function() {
	cancel_today();
    });
    document.getElementById("go").addEventListener("click", function() {
	confirm_today(document.getElementById("newplace").value);
    });
}, false);


$(document).ready(function() {
    set_default_LL();

/*
    $("#go").click(function() {
        var q = encodeURI($("#newplace").val());
        $.ajax({
            url: "https://api.foursquare.com/v2/venues/search?" + LL + "&radius=400&query=" + q + "&categoryId=4d4b7105d754a06374d81259&" + NOLOGIN_SUFFIX,
        }).done(function(data) {
        console.log(data.response.venues.length + " results");
        $.each(data.response.venues, function(i, venue) {
            console.log(venue.name + " @ " + venue.location.address);
            });
        });
    });
*/

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

function HashURL() {
    // TODO
}


function MainUI() {
    function toggled_confirmed() {
	if ($("body").hasClass("no-confirmed")) {
	    $("body").removeClass("no-confirmed").addClass("yes-confirmed");
	    document.location.hash = "#confirmed";
	}
	else {
	    $("body").addClass("no-confirmed").removeClass("no-confirmed");
	    document.location.hash = "#new";
	}
    }
    function init() {
	$("#toggle-info-map").click(function() {
	    if ($("#main-container").hasClass("no-info-map")) {
		$("#main-container").removeClass("no-info-map");
	    }
	    else {
		$("#main-container").addClass("no-info-map");
	    }
	});

	$("#typehere").click(function() {
	    var contenteditable = $("#typehere").attr("contenteditable");
	    if (typeof contenteditable == "string") {
	        $("#typehere").attr("contenteditable", null);
	    }
	    else {
	        $("#typehere").attr("contenteditable", "");
	    }
	});

	$("#options-yes").click(function() {
	    // toggled_confirmed();
	    if (today_recommendation) {
		confirm_today(get_today_recommendation_name());
	    }
	});

	$("#options-no").click(function() {
	    cancel_today();
	});

	$("#cancel-button").click(function() {
	    cancel_today();
	});

	$(".timeline-div.plus").click(function() {
	    createmeal();
	});

	$("#review-delete").click(function() {
	    deletemeal();
	});

	$(window).on("hashchange", function() {
	    goto_hash();
	});
    }
    var spinner;
    function goto_hash() {
	console.log("goto_hash " + document.location.hash);
	if (document.location.hash == "#confirmed") {
	    new_mode = true;
	    $("body").addClass("yes-confirmed").removeClass("no-confirmed").removeClass("old").removeClass("loading").removeClass("failed");
	}
	else if (document.location.hash == "#loading") {
	    new_mode = true;
	    var opts = {
		lines: 20, // The number of lines to draw
		length: 100, // The length of each line
		width: 20, // The line thickness
		radius: 100, // The radius of the inner circle
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
		top: 'auto', // Top position relative to parent in px
		left: 'auto' // Left position relative to parent in px
	    };
	    if (! spinner)
		spinner = new Spinner(opts);
	    if (spinner)
		spinner.spin($("#loading-spinner")[0]);
	    $("body").removeClass("yes-confirmed").addClass("no-confirmed").removeClass("old").addClass("loading").removeClass("failed");
	}
	else if (document.location.hash == "#failed") {
	    new_mode = true;
	    $("body").removeClass("yes-confirmed").addClass("no-confirmed").removeClass("old").removeClass("loading").addClass("failed");
	}
	else if (document.location.hash != "#new") {
	    new_mode = false;
	    $("body").removeClass("yes-confirmed").removeClass("no-confirmed").addClass("old").removeClass("loading").removeClass("failed");
	}
	else {
	    new_mode = true;
	    $("body").removeClass("yes-confirmed").addClass("no-confirmed").removeClass("old").removeClass("loading").removeClass("failed");
	}
    }
    this.init = init;
    this.goto_hash = goto_hash;
    return this;
}

function URLHasher() {
}

function FoursquareFormatted(venue) {
    function _format_hours() {
    }
    function _format_icon() {
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
    function _format_canonical_url() {
	return venue.canonicalUrl;
    }
    function _format_addr() {
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
    function _format_distance() {
	if (venue.location.distance) {
	    return Math.ceil(venue.location.distance / 100) + " min walk"
	}
	else {
	    return "nearby";
	}
    }
    function _show_map() {
	// Use Google Maps API to show the location.
    }
    function _format_detailed_addr() {
	if (venue.location.crossStreet) {
	    return venue.location.address + "("  + venue.location.crossStreet + ")";
	}
	else {
	    return venue.location.address;
	}
    }
    function _format_contact() {
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
    function apply(mapping) {
	console.log("Applying");
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

function Backend() {
    // var historyId;
    // var today_recommendation;
    // var autocomplete_should_reload;
    function foursquare_details_received(resp, venue) {
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
    function foursquare_received(resp, name, venue) {
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
	document.location.hash = "#new";
    }
    function today_recommendation_received_new_ui(resp, venue) {
	console.log("new UI");
	console.log(resp);

	if (resp.historyId && resp.historyId != historyId) {
	    historyId = resp.historyId;
	}
	if (! resp.name) {
	    document.location.hash = "#loading";
	    if (resp && resp.hints && resp.hints.ll)
		console.log("resp.hints.ll = " + resp.hints.ll);
	    if (! venue && resp.hints && (resp.hints.ll || resp.hints.near)) {
		get_recommendation_from_foursquare(resp.hints.ll, resp.hints.near, function(name, venue) {
		    foursquare_received(resp, name, venue);
		});
	    }
	    else {
		document.location.hash = "#loading";
		if (navigator && navigator.geolocation) {
		    navigator.geolocation.getCurrentPosition(function(position) {
			resp.hints = {}
			resp.hints.ll = position.coords.latitude + "," + position.coords.longitude;
			today_recommendation_received(resp);
			return;
		    },
		    function () {
			document.location.hash = "#failed";
		    });
		}
	    }
	}
	else {
	    $("#title-source").text(" (lunchere)");
	    $("#title-text").text(resp.name);
	    if (resp.confirmed) {
		document.location.hash = "#confirmed";
	    }
	    else {
		document.location.hash = "#new";
	    }
	}
	if (venue) {
	    foursquare_details_received(resp, venue);
	}
	if (resp && resp.foursquare_id &&
		(!today_recommendation || resp.foursquare_id != today_recommendation.foursquare_id) &&
		!resp.foursquare_venue && ! venue) {
	    foursquareCache.fetch(resp.foursquare_id, function(venue) {
		foursquare_details_received(resp, venue);
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
    var cache = {};
    function fetch(id, callback) {
	get_details_from_foursquare(id, function(venue) {
	    cache[id] = venue;
	    callback(venue);
	});
    }

    this.fetch = fetch;
    this.cache = cache;
    return this;
}

function LunchereCache() {
    function fetch(canteen_id, foursquare_id, callback) {
	var lunch = {
	    "historyId": historyId,
	    "name": canteen_id,
	    "timeslot": today_recommendation.timeslot,
	    "foursquare_id": foursquare_id,
	};
	if (foursquare_id) {
	    foursquareCache.fetch(foursquare_id, function(venue) {
		callback(lunch, venue);
	    });
	}
	else {
	    callback(lunch, null);
	}
    }
    this.fetch = fetch;
    return this;
}

var new_mode = false;
var mainUI = new MainUI();
var backend = new Backend();
var today_recommendation_received_new_ui = backend.today_recommendation_received_new_ui;
var foursquareCache = new FoursquareCache();
var lunchereCache = new LunchereCache();

$(document).ready(function() {
    mainUI.init();
    mainUI.goto_hash();
});
