function LandingSpinner (target) {
    // http://fgnass.github.io/spin.js/
    var size = 20;
    console.log(size);
    var opts = {
	lines: 9, // The number of lines to draw
	length: size / 4, // The length of each line
	width: 2, // The line thickness
	radius: size / 5, // The radius of the inner circle
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
    var spinner = new Spinner(opts);

    var spinner_count = 0;
    function spinner_inc() {
	if (spinner_count == 0) {
	    $(target).show();
	    spinner.spin(target);
	}
	spinner_count ++;
    }

    function spinner_dec() {
	spinner_count --;
	if (spinner_count == 0) {
	    $(target).hide();
	    spinner.stop(target);
	}
    }
    this.inc = spinner_inc;
    this.dec = spinner_dec;
    this.spinner = spinner;
    this._target = target;
    return this;
}

function LLGeocoder(spinner, submit_callback) {
    var location_pick = document.getElementById("arrow");
    var location_input = document.getElementById("location");
    var submit_button = document.getElementById("find");

    var selected_ll;
    function set_selected_ll(ll) {
	if (ll) {
	    selected_ll = ll;
	    $(location_pick).addClass("has-location");
	}
    }
    function debug(text) {
	console.log(text);
    }
    function disable_pick() {
	$(location_pick).css("opacity", 0);
    }
    function disable_submit() {
	$(submit_button).attr("disabled", true).removeClass("enabled").addClass("disabled");
    }
    function enable_submit(ll) {
	if (ll) {
	    set_selected_ll(ll);
	    $(submit_button).attr("disabled", false).removeClass("disabled").addClass("enabled");
	}
	else if (selected_ll) {
	    $(submit_button).attr("disabled", false).removeClass("disabled").addClass("enabled");
	}
    }
    function disable_input() {
	$(location_input).attr("disabled", true);
    }
    function enable_input() {
	$(location_input).attr("disabled", false);
    }
    function format_google_addr(obj, n) {
	var a = obj.formatted_address.split(", ");
	if (a.length > n) {
	    return a.slice(-n - 1, -1).join(", ");
	}
	else {
	    return obj.formatted_address;
	}
    }
    function fill_geocode_with_ll(p0, ll) {
	var url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + p0.lat + "," + p0.lng + "&sensor=false";
	spinner.inc();
	$.ajax({
	    url: url
	}).done(function(data) {
	    spinner.dec();
	    if (data.results.length) {
		var obj = data.results[0];
		var addr = format_google_addr(obj, 2);
		$(location_input).val(addr);
	    }
	    enable_input();
	    enable_submit(ll);
	}).fail(function() {
	    spinner.dec();
	    console.log("GOOGLE ERROR");
	    response([]);
	});
    }
    function dynamic_source_gmaps(request, response) {
        var q0 = request.term;
        var q = encodeURI(q0);
	var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + q + "&sensor=false";
	disable_submit();
	spinner.inc();
	$.ajax({
	    url: url
	}).done(function(data) {
	    spinner.dec();
	    var a = []
	    $.each(data.results, function(i, obj) {
		console.log(obj);
		a.push({
		    "label": format_google_addr(obj, 100),
		    "value": format_google_addr(obj, 2),
		    "type": "gmaps",
		    "obj": obj,
		});
	    });
	    response(a);
	    enable_input();
	}).fail(function() {
	    spinner.dec();
	    console.log("GOOGLE ERROR");
	    response([]);
	});
    }
    function dynamic_source(request, response) {
	return dynamic_source_gmaps(request, response);
    }
    function dynamic_source_select(_event, ui) {
        if (ui.item.type == "gmaps") {
            $(location_input).val(ui.item.value);
	    var ll = ui.item.obj.geometry.location.lat + "," + ui.item.obj.geometry.location.lng;
	    debug("select ll = " + ll);
	    enable_submit(ll);
        }
        else if (ui.item.type == "geocode") {
            $(location_input).val(ui.item.value);
        }
        else {
        }
	_event.preventDefault();
    }

    function location_pick_callback(position) {
        var ll = position.coords.latitude + "," + position.coords.longitude;
        debug("pick ll = " + ll);

        // geocode_ll(ll, ll_geocode_fetched, ll_geocode_failed);
	var p0 = { "lat": position.coords.latitude, "lng": position.coords.longitude };
	// $(location_input).autocomplete("search", "");
	fill_geocode_with_ll(p0, ll);
    }
    function location_pick_clicked() {
	if (navigator && navigator.geolocation) {
	    disable_input();
	    disable_submit();
            debug("fetching location");
            navigator.geolocation.getCurrentPosition(location_pick_callback);
        }
        else{
	    enable_input();
	    enable_submit();
	    disable_pick();
        }
    }

    $(location_pick).click(location_pick_clicked);
    $(location_input).autocomplete({
        source: dynamic_source,
        minLength: 0,
        select: dynamic_source_select,
    });
    $(submit_button).click(function (_event, ui){
	debug("submitting");
	submit_callback(selected_ll, $(location_input).val());
    });

    return this;
}

var landingPage;
function LandingPage(ck) {
    var landingSpinner;
    var llGeocoder;
    function get_link_from_id(id) {
	if (/^history:/.test(id)) {
	    return '/t/' + id.slice(8);
	}
	else {
	    throw "cannot no link: " + id;
	}
    }
    function plural(count, single, plural, suffix) {
	if (count == 1) {
	    return "" + count + " " + single + " " + suffix;
	}
	else {
	    return "" + count + " " + plural + " " + suffix;
	}
    }
    function relative_date(dt) {
	var now = new Date();
	var date1 = new Date(now);
	date1.setDate(1);
	date1.setFullYear(dt.getFullYear());
	date1.setMonth(dt.getMonth());
	date1.setDate(dt.getDate());
	days_diff = (now - date1) / (86400 * 1000);
	if (days_diff >= 365)
	    return plural(Math.floor(days_diff / 365), "year", "years", "ago")
	else if (days_diff >= 30)
	    return plural(Math.floor(days_diff / 30), "month", "months", "ago")
	else if (days_diff >= 1)
	    return plural(Math.floor(days_diff), "day", "days", "ago")
	else
	    return "today";
    }
    function toggle_recent_timelines() {
	var toggler = new ClassToggler({
	    "#recent-timelines-container": {
		"mapping": {
		    "hidden": ! $("#recent-timelines > li").length,
		}
	    },
	    "#location-predesc": {
		"mapping": {
		    "has-timelines": !! $("#recent-timelines > li").length,
		}
	    },
	});
	toggler.apply();
    }
    function trash_clicked(_event) {
	var li = $(_event.delegateTarget).parent()[0];
	var timeline = li.timeline;
	ck.clear_cookie(timeline.id, "/");
	delete ck.timelines[timeline.id];
	$(li).detach();
	toggle_recent_timelines();
    }
    function html_decode(html) {
	return $("<span>").html(html).text();
    }
    function show_timelines() {
	$.each(ck.timelines, function (k, timeline) {
	    try{
		var li = $("<li>")
			 .append($("<i>").addClass("icon-remove").addClass("enabled").click(trash_clicked))
		         .append($("<a>").attr("href", get_link_from_id(timeline.id)).text(html_decode(timeline.name)))
			 .append($("<div>").text(html_decode(timeline.town) + ", " + relative_date(timeline.lastdt)))
			 .appendTo($("#recent-timelines"));
		li[0].timeline = timeline;
	    }
	    catch (e) {
		console.log(e);
	    }
	});
	toggle_recent_timelines();
    }
    function run() {
        landingSpinner = new LandingSpinner(document.getElementById("spinner"));
        llGeocoder = new LLGeocoder(landingSpinner,
	    // submit_callback
	    function (ll, near) {
		var url = "/new?ll=" + encodeURIComponent(ll) + "&near=" + encodeURIComponent(near);
		document.location = url;
	    });
	this.landingSpinner = landingSpinner;
	this.llGeocoder = llGeocoder;

	show_timelines();
    }
    this.run = run;
    return this;
}

var landingPage = new LandingPage(ck);
window.addEventListener("load", function load() {
    landingPage.run();
}, false);
