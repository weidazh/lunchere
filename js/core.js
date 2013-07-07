function getCookie(c_name, _default) {
    var c_value = document.cookie;
    var c_start = c_value.indexOf(" " + c_name + "=");
    if (c_start == -1) {
	c_start = c_value.indexOf(c_name + "=");
    }
    if (c_start == -1) {
	c_value = _default;
    }
    else {
	c_start = c_value.indexOf("=", c_start) + 1;
	var c_end = c_value.indexOf(";", c_start);
	if (c_end == -1) {
	    c_end = c_value.length;
	}
	c_value = unescape(c_value.substring(c_start,c_end));
    }
    return c_value;
}

var zenzen_noauth = 1;
var initObj = initClientIdHistoryId();
var historyId = initObj["historyId"];
var CLIENT_ID = initObj["CLIENT_ID"];
var USE_COOKIE = initObj["USE_COOKIE"];

function lunchere_api_init() {
    var apisToLoad;
    var callback = function(msg) {
        console.log(msg + " loaded");
        if (--apisToLoad == 0) {
            signin(true, user_authed_no_retry);
        }
    }
    console.log("INIT");
    var ROOT = '/_ah/api';
    apisToLoad = 2;
    if (zenzen_noauth) {
	apisToLoad -= 1;
    }
    else {
	gapi.client.load('oauth', 'dev', callback, ROOT);
    }
    gapi.client.load('lunchere', 'dev', callback, ROOT);
}

function require_login(resp) {
    if (typeof(resp.error) !== "undefined" && resp.code == resp.error.code) {
	console.log("ERROR");
	console.log(resp);
	if (resp.code == 401) {
	    // ?? How to manually logout?
	    signin(false, user_authed_no_retry);
	}
	return false;
    }
    else {
	console.log("OK");
	console.log(resp);
	return true;
    }
}

function signin(mode, callback) {
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
	gapi.auth.authorize({client_id: CLIENT_ID,
		scope: SCOPES, immediate: mode,
		response_type: 'token id_token'},
		callback);
    }
}

function user_authed_retry(token) {
    if (! user_authed_no_retry(token)) {
	signin(false, user_authed_no_retry);
    }
}

function user_authed_no_retry(token) {
    // Example of token
    //    access_token: "ya29.AHEi.................lrspejV4"
    //    client_id: "41839733.................usercontent.com"
    //    id_token: "eyJhbGci..........................2oFopTpT-nhtWLD8"
    if (token) {
	// This overwriting is well documented by 
	//         https://developers.google.com/appengine/docs/python/endpoints/consume_js#adding-oath-authentication
	token.access_token = token.id_token;
	gapi.auth.setToken(token);
	first_call(true);
	return true;
    }
    else {
	console.log("ERROR Cannot auth");
	first_call(false);
	return false;
    }
    // first_call();
}

function setCookie(c_name, value, exdays) {
    if (! USE_COOKIE) {
	return;
    }
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value = escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
    document.cookie = c_name + "=" + c_value;
}


function first_call(authed) {
    if (1 /* NO TEST */) {
	second_call(authed);
	return;
    }
    gapi.client.lunchere.test().execute(function(resp) {
	if (! require_login(resp))
	    return;
	second_call(authed);
    });
}

var today_recommendation;

function today_recommendation_received(resp) {
    if (resp.historyId && resp.historyId != historyId) {
	historyId = resp.historyId;
	setCookie("historyId", historyId, 7);
    }
    if (! resp.name) {
	document.getElementById("today").innerHTML = "No recommendation";
    }
    else {
	document.getElementById("today").innerHTML = resp.name;
    }
    document.getElementById("historyId").innerHTML = historyId;
    if (resp.confirmed)
	document.getElementById("confirmed").innerHTML = "(confirmed)";
    else
	document.getElementById("confirmed").innerHTML = "";
    today_recommendation = resp;
}

function get_today_recommendation_name() {
    return today_recommendation.name;
}

function second_call(authed) {
    var func;
    if (authed)
	func  = gapi.client.lunchere.today();
    else
	func  = gapi.client.lunchere.todayUnauth({ "historyId": historyId} );
    func.execute(function(resp) {
	if (! require_login(resp))
	    return;
	today_recommendation_received(resp);
    });
}

function confirm_today(name) {
    console.log("confirm_today");
    if (today_recommendation) {
	gapi.client.lunchere.yesUnauth({ "historyId": today_recommendation.historyId, "name": name }).execute(function(resp) {
	    console.log("confirmed");
	    console.log(resp);
	    today_recommendation_received(resp);
	});
    }
}

function cancel_today() {
    console.log("cancel_today");
    if (today_recommendation) {
	gapi.client.lunchere.noUnauth({ "historyId": today_recommendation.historyId, "name": get_today_recommendation_name() }).execute(function(resp) {
	    console.log("cancelled");
	    console.log(resp);
	    today_recommendation_received(resp);
	});
    }
}

window.addEventListener("load", function load() {
    console.log("window.load");
    window.removeEventListener("load", load, false);
    document.getElementById("logout").addEventListener("click", function() {
	gapi.auth.setToken(null);
	historyId = undefined;
	today_recommendation = undefined;
	setCookie("historyId", "Unknown", 7);
	document.getElementById("historyId").innerHTML = "undefined";
	document.getElementById("today").innerHTML = "reloading ...";
	document.getElementById("confirmed").innerHTML = "";
	// signin(true, user_authed_no_retry);
	document.location = "/logout";
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


