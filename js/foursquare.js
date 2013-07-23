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

var FOOD_ID = "4d4b7105d754a06374d81259";
function parse_food_id(obj, prefix) {
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
        if (FOOD_ID != obj.id) {
            console.log("WARNING: the foursquare food.id is updated, please upgrade the code");
        }
        FOOD_ID = obj.id;
    }
    if (obj.categories) {
        $(obj.categories).each(function(i, sub_obj) {
            parse_food_id(sub_obj, new_prefix);
        });
    }
}

function reload_food_id() {
    $.ajax({
        url: "https://api.foursquare.com/v2/venues/categories?" + NOLOGIN_SUFFIX,
    }).done(function(data) {
        parse_food_id(data.response, "");
    });
}

function search_foursquare_name_by_ll(ll, callback) {
    $.ajax({
        url: "https://api.foursquare.com/v2/venues/search?ll=" + ll + "&" + NOLOGIN_SUFFIX,
    }).done(function(data) {
        var best = 10000000000;
        var best_venue;
        $(data.response.venues).each(function(i, venue) {
            if (venue.location.distance < best && venue.location.address && venue.location.city) {
                best_venue = venue;
                best = venue.location.distance;
            }
            if (! best_venue.location.state) {
                best_venue.location.state = venue.location.state;
            }
        });
        callback(best_venue.name/* + " @ " + best_venue.location.address */);
    }).fail(function() {
        // fail
    });
}

function search_foursquare_name_by_query(query, callback) {
    $.ajax({
        url: "https://api.foursquare.com/v2/venues/search?ll=" + ll + "&" + NOLOGIN_SUFFIX,
    }).done(function(data) {
        var best = 10000000000;
        var best_venue;
        $(data.response.venues).each(function(i, venue) {
            if (venue.location.distance < best && venue.location.address && venue.location.city) {
                best_venue = venue;
                best = venue.location.distance;
            }
            if (! best_venue.location.state) {
                best_venue.location.state = venue.location.state;
            }
        });
        callback(best_venue.location.address.split(",").slice(0, 1) + ", " + best_venue.location.city + ", " + best_venue.location.state);
    }).fail(function() {
        // fail
    });
}

function search_ll_from_address(addr, callback, callback_fail) {
    $.ajax({
        url: "https://api.foursquare.com/v2/venues/explore?near=" + encodeURI(addr) + "&intent=explore&limit=1&" + NOLOGIN_SUFFIX
    }).done(function (data) {
        if (data.response.geocode) {
            callback(data.response.geocode.displayString, data.response.geocode);
        }
        else {
            callback_fail();
        }
    }).fail(function (data) {
        console.log("ERROR");
        callback_fail();
    });
}

var foursquare_recommendation_offset = 1;
function get_recommendation_from_foursquare(ll, near, callback) {
    var AND_FOOD_ID = "&categoryId=" + FOOD_ID; // instead of ""
    var query = "";
    console.log("get_recommendation_from_foursquare " + ll + ", " + near + ", " + callback);
    if (ll && near)
        query += "ll=" + ll + "&near=" + near;
    else if (ll)
        query += "ll=" + ll;
    else if (near)
        query += "near=" + near;
    $.ajax({
	url: "https://api.foursquare.com/v2/venues/explore?" + query + AND_FOOD_ID + "&section=food&intent=explore&radius=1000&limit=1&offset=" + foursquare_recommendation_offset + "&" + NOLOGIN_SUFFIX
    }).done(function (data) {
        console.log(data);
        $(data.response.groups).each(function(i, group) {
            if (group.name == "recommended") {
                $(group.items).each(function(j, item) {
                    foursquare_recommendation_offset++;
                    callback(item.venue.name, item.venue);
                    return;
                });
            }
        });

    }).fail(function() {
        console.log("ERROR");
    });
}

function get_details_from_foursquare(foursquare_id, callback) {
    var query = "";
    $.ajax({
	url: "https://api.foursquare.com/v2/venues/" + foursquare_id + "?" + NOLOGIN_SUFFIX
    }).done(function (data) {
        var venue = data.response.venue;
	callback(venue);
    }).fail(function() {
        console.log("ERROR");
    });

}
