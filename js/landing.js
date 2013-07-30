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

    var p0 = { };
    var selected_ll;
    function set_selected_ll(ll) {
	if (ll) {
	    selected_ll = ll;
	    $(location_pick).addClass("has-location");
	}
    }
    function debug(text) {
	$("#debug-layer").text(text);
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
    function dynamic_source_gmaps(request, response) {
        var q0 = request.term;
        var q = encodeURI(q0);
	var url;
	disable_submit();
        if (q0.length >= 1) {
	    url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + q + "&sensor=false";
	}
	else {
	    url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + p0.lat + "," + p0.lng + "&sensor=false"
	}
	spinner.inc();
	$.ajax({
	    url: url
	}).done(function(data) {
	    spinner.dec();
	    var a = []
	    $.each(data.results, function(i, obj) {
		a.push({
		    "label": obj.formatted_address,
		    "value": obj.formatted_address,
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
	p0 = { "lat": position.coords.latitude, "lng": position.coords.longitude };
	// $(location_input).autocomplete("search", "");
	enable_submit(ll);
	enable_input();
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
	submit_callback(selected_ll);
    });

    return this;
}

var landingPage;
function LandingPage() {
    var landingSpinner;
    var llGeocoder;
    function run() {
        landingSpinner = new LandingSpinner(document.getElementById("spinner"));
        llGeocoder = new LLGeocoder(landingSpinner, function (ll) {
	    document.location = "/new?ll=" + ll;
	});
	this.landingSpinner = landingSpinner;
	this.llGeocoder = llGeocoder;
    }
    this.run = run;
    return this;
}

var landingPage = new LandingPage();
window.addEventListener("load", function load() {
    landingPage.run();
}, false);
