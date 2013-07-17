
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
        $(data.response.venues).each(function(i, venue) {
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

    function dynamic_source(request, response) {
        var q0 = request.term;
        var q = encodeURI(q0);
        var a_lunchere;
        var a_foursquare;
        function callback_both() {
            if (a_lunchere && a_foursquare) {
                response(a_lunchere.concat([{
                    "label": "-----------",
                    "value": "-----------",
                    "type": "separator",
                }]).concat(a_foursquare));
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
            $(data.response[minivenues]).each(function(i, minivenue) {
                var name = minivenue.name + " @ " + minivenue.location.address;
                var name_addr = minivenue.name + " @ " + minivenue.location.address + " (" + minivenue.location.distance + "m)";
                console.log(name_addr);
                var is_food = false;
                $(minivenue.categories).each(function(j, category) {
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
            $("#newplace").val(ui.item.obj.name);
            $("#addr").val(ui.item.obj.location.address);
            _event.preventDefault();
        }
        else if (ui.item.type == "lunchere") {
            console.log("lunchere");
            $("#newplace").val(ui.item.value);
            $("#addr").val("");
            _event.preventDefault();
        }
        else {
            _event.preventDefault();
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

	$("#options-yes").click(function() {
	    // toggled_confirmed();
	    confirm_today(get_today_recommendation_name());
	});

	$("#options-no").click(function() {
	    cancel_today();
	});

	$("#cancel-button").click(function() {
	    cancel_today();
	});

	$(window).on("hashchange", function() {
	    goto_hash();
	});
    }
    var spinner;
    function goto_hash() {
	console.log("goto_hash " + document.location.hash);
	if (document.location.hash == "#confirmed") {
	    $("body").addClass("yes-confirmed").removeClass("no-confirmed").removeClass("old").removeClass("loading").removeClass("failed");
	}
	else if (document.location.hash == "#loading") {
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
	    $("body").removeClass("yes-confirmed").addClass("no-confirmed").removeClass("old").removeClass("loading").addClass("failed");
	}
	else if (document.location.hash != "#new") {
	    $("body").removeClass("yes-confirmed").removeClass("no-confirmed").addClass("old").removeClass("loading").removeClass("failed");
	}
	else {
	    $("body").removeClass("yes-confirmed").addClass("no-confirmed").removeClass("old").removeClass("loading").removeClass("failed");
	}
    }
    this.init = init;
    this.goto_hash = goto_hash;
    return this;
}

function Backend() {
    // var historyId;
    // var today_recommendation;
    // var autocomplete_should_reload;
    function today_recommendation_received_new_ui(resp) {
	console.log("new UI");
	console.log(resp);

	if (resp.historyId && resp.historyId != historyId) {
	    historyId = resp.historyId;
	}
	if (! resp.name) {
	    document.location.hash = "#loading";
	    console.log("resp.hints.ll = " + resp.hints.ll);
	    if (resp.hints && (resp.hints.ll || resp.hints.near)) {
		get_recommendation_from_foursquare(resp.hints.ll, resp.hints.near, function(name) {
		    console.log("name = " + name);
		    $("#title-text").text(name);
		    resp.name = name; // today_recommendation would be the same object.
		    resp.has_other_recommend = true;
		    document.location.hash = "#new";
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
	    $("#title-text").text(resp.name);
	    if (resp.confirmed) {
		document.location.hash = "#confirmed";
	    }
	    else {
		document.location.hash = "#new";
	    }
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

    this.today_recommendation_received_new_ui = today_recommendation_received_new_ui;
    return this;
}

var mainUI = new MainUI();
var backend = new Backend();
var today_recommendation_received_new_ui = backend.today_recommendation_received_new_ui;

$(document).ready(function() {
    mainUI.init();
    mainUI.goto_hash();
});
