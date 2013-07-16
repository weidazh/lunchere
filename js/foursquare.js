var LL; // in private.js
var NOLOGIN_SUFFIX; // in private.js

function set_default_LL() {
    console.log(navigator);
    if (navigator && navigator.geolocation) {
        console.log("fetching location");
        navigator.geolocation.getCurrentPosition(position_callback);
    }
    else{
        // LL unchanged.
        console.log("cannot get your location");
    }
}
function position_callback(position) {
    LL = "ll=" + position.coords.latitude + "," + position.coords.longitude;
    console.log("location is changed to " + LL);
}

set_default_LL();

var gdata;
function explore(obj, prefix) {
    var new_prefix = "";
    // console.log(obj);
    if (obj.name) {
        current_name = prefix + obj.name;
        new_prefix = prefix + obj.name + " / ";
    }
    else {
        current_name = "";
        new_prefix = "";
    }
    // console.log(current_name);
    if (current_name == "Food") {
        console.log(obj);
    }
    if (obj.categories) {
        $(obj.categories).each(function(i, sub_obj) {
            explore(sub_obj, new_prefix);
        });
    }
}

$.ajax({
    url: "https://api.foursquare.com/v2/venues/categories?" + NOLOGIN_SUFFIX,
}).done(function(data) {
    explore(data.response, "");
});

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
                url: "https://api.foursquare.com/v2/venues/" + suggestcompletion + "?" + LL + "&radius=1000&limit=10&query=" + q + "&" + NOLOGIN_SUFFIX
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
