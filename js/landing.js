var spinner_count = 0;
var spinner_timer;
var spinner_degree = 0;
function spinner_spin() {
    // For webkit browsers: e.g. Chrome
    $("#spinner").css('WebkitTransform', 'rotate(' + spinner_degree + 'deg)');
    // For Mozilla browser: e.g. Firefox
    $("#spinner").css('-moz-transform', 'rotate(' + spinner_degree + 'deg)');
    
    spinner_timer = setTimeout(function() {
	spinner_degree += 15;
	spinner_spin();
    }, 30);

}
function spinner_inc() {
    if (spinner_count == 0) {
	$("#spinner").show();
	spinner_spin();
    }
    spinner_count ++;
}

function spinner_dec() {
    spinner_count --;
    if (spinner_count == 0) {
	$("#spinner").hide();
	clearTimeout(spinner_timer);
    }
}

window.addEventListener("load", function load() {
    function modify_location(name) {
        document.getElementById("location").value = name;
    }
    var ll = undefined;
    function location_callback(position) {
        window.gp = position;
        ll = position.coords.latitude + "," + position.coords.longitude;
        console.log("location is changed to " + ll);
        document.getElementById("location").value = ll;

        search_foursquare_name_by_ll(ll, modify_location);
    }
    document.getElementById("arrow").addEventListener("click", function() {
	 if (navigator && navigator.geolocation) {
            console.log("fetching location");
            navigator.geolocation.getCurrentPosition(location_callback);
        }
        else{
            // LL unchanged.
            console.log("cannot get your location");
        }
    });
    document.getElementById("find").addEventListener("click", function() {
        if (ll) {
            document.location = 
                "/new?ll=" + ll;
        }
        else {
            search_ll_from_address(document.getElementById("location").value,
                function (l, obj) {
                    document.location = 
                         "/new?near=" + encodeURI(l)
                    document.getElementById("location").value = l;
                    $("#error-warning").css("opacity", "0");
                },
                function () {
                    $("#error-warning").css("opacity", "1");
                });
        }
    });

    var suggestcompletion = "search"; // instead of suggestCompletion, because the latter failed to restrict in radius
    var minivenues = "venues"; // instead of "minivenues";
    var AND_FOOD_ID = ""; // the user does not need to be eating some food.
    function callback_foursquare(data) {
        var a_foursquare = [];
        $(data.response[minivenues]).each(function(i, minivenue) {
            var name = minivenue.name + " @ " + minivenue.location.address;
            var name_addr = minivenue.name + " @ " + minivenue.location.address + " (" + minivenue.location.distance + "m)";
            a_foursquare.push({
                "label": name,
                "value": name,
                "type": "foursquare",
                "obj": minivenue
            });
        });
        return a_foursquare;
    }
    function dynamic_source_foursquare(request, response) {
        var q0 = request.term;
        var q = encodeURI(q0);
        if (q0.length >= 1) {
            if (ll) {
                spinner_inc();
                $.ajax({
                    url: "https://api.foursquare.com/v2/venues/" + suggestcompletion + "?" + ll + AND_FOOD_ID + "&radius=1000&limit=10&query=" + q + "&" + NOLOGIN_SUFFIX
                }).done(function(data) {
                    spinner_dec();
                    response(callback_foursquare(data));
                }).fail(function() {
                    spinner_dec();
                    console.log("ERROR");
                    response([]);
                });
            }
            else {
                spinner_inc();
                search_ll_from_address(q0,
                    function(name, obj) {
                        spinner_dec();
                        response([{
                            'label': name,
                            'value': name,
                            'type': 'geocode',
                            'obj': obj
                        }]);
                    },
                    function() {
                        spinner_dec();
                        response([]);
                    });
            }
        }
        else {
            response([]);
        }
    }
    function dynamic_source_gmaps(request, response) {
        var q0 = request.term;
        var q = encodeURI(q0);
        if (q0.length >= 1) {
	    $.ajax({
		url: "https://maps.googleapis.com/maps/api/geocode/json?address=" + q + "&sensor=false"
	    }).done(function(data) {
		var a = []
		$(data.results).each(function(i, obj) {
		    a.push({
			"label": obj.formatted_address,
			"value": obj.formatted_address,
			"type": "gmaps",
			"obj": obj,
		    });
		});
		response(a);
	    }).fail(function() {
		console.log("GOOGLE ERROR");
		response([]);
	    });
	}
    }
    function dynamic_source(request, response) {
	var af = [];
	var ag = [];
	var has_foursquare = false;
	function do_response() {
	    response(ag.concat({
		'label': '------',
		'value': '------',
		'type': 'separator',
	    }).concat(af));
	}
	if (has_foursquare) {
	    dynamic_source_foursquare(request, function (a) {
		af = a;
		do_response();
	    });
	}
	dynamic_source_gmaps(request, function (a) {
	    ag = a;
	    if (has_foursquare)
		do_response();
	    else
		response(a);
	});
    }
    function dynamic_source_select(_event, ui) {
        if (ui.item.type == "foursquare") {
            $("#location").val(ui.item.obj.name);
            // $("#addr").val(ui.item.obj.location.address);
            _event.preventDefault();
        }
        else if (ui.item.type == "gmaps") {
            $("#location").val(ui.item.obj.formatted_address);
            // $("#addr").val(ui.item.obj.location.address);
            _event.preventDefault();
        }
        else if (ui.item.type == "geocode") {
            $("#location").val(ui.item.value);
            _event.preventDefault();
        }
        else {
            _event.preventDefault();
        }
    }

    $("#location").autocomplete({
        source: dynamic_source,
        minLength: 0,
        select: dynamic_source_select,
    });
}, false);
