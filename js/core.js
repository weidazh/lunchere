var zenzen_noauth = 1;
var initObj = initClientIdHistoryId();
var historyId = initObj["historyId"];
var CLIENT_ID = initObj["CLIENT_ID"];
var API_VERSION = initObj["API_VERSION"];
var autocomplete_should_reload = false;

function lunchere_api_init() {
    var apisToLoad;
    var callback = function(msg) {
        console.log(msg + " loaded");
        if (--apisToLoad == 0) {
	    if (gapi.client.lunchere) {
		signin(true, user_authed_no_retry);
	    }
	    else {
		console.log("cannot load lunchere")
	    }
        }
    }
    console.log("INIT");
    var ROOT = '/_ah/api';
    apisToLoad = 2;
    if (zenzen_noauth) {
	apisToLoad -= 1;
    }
    else {
	gapi.client.load('oauth', API_VERSION, callback, ROOT);
    }
    gapi.client.load('lunchere', API_VERSION, callback, ROOT);
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
    }
    if (! resp.name) {
	document.getElementById("today").innerHTML = "(loading from foursquare)";
	document.getElementById("confirmed").innerHTML = "";
	document.getElementById("yes").disabled = true;
	document.getElementById("no").disabled = ! resp.has_other_recommend;
	document.getElementById("go").disabled = false;
	if (resp.hints && (resp.hints.ll || resp.hints.near)) {
	    get_recommendation_from_foursquare(resp.hints.ll, resp.hints.near, function(name) {
		console.log("name = " + name);
		document.getElementById("today").innerHTML = name;
		resp.name = name; // today_recommendation would be the same object.
		resp.has_other_recommend = true;
		document.getElementById("no").disabled = false;
		document.getElementById("yes").disabled = false;
	    });
	}
    }
    else {
	document.getElementById("today").innerHTML = resp.name;
	if (resp.confirmed) {
	    document.getElementById("confirmed").innerHTML = "(confirmed)";
	    document.getElementById("yes").disabled = true;
	    document.getElementById("no").disabled = false;
	    document.getElementById("go").disabled = false;
	}
	else {
	    document.getElementById("confirmed").innerHTML = "";
	    document.getElementById("yes").disabled = false;
	    document.getElementById("no").disabled = false;
	    document.getElementById("go").disabled = false;
	}
    }
    document.getElementById("historyId").innerHTML = historyId;
    document.getElementById("timeslot").innerHTML = resp.timeslotFriendly;
    document.getElementById("deletemeal").disabled = ! resp.could_delete;
    document.getElementById("prevmeal").disabled = ! resp.has_prevmeal;
    document.getElementById("nextmeal").disabled = ! resp.has_nextmeal;
    document.getElementById("createmeal").disabled = ! resp.has_createmeal;
    today_recommendation = resp;
    autocomplete_should_reload = true;
}

function disable_all() {
    document.getElementById("yes").disabled = true;
    document.getElementById("no").disabled = true;
    document.getElementById("go").disabled = true;
    document.getElementById("deletemeal").disabled = true;
    document.getElementById("prevmeal").disabled = true;
    document.getElementById("nextmeal").disabled = true;
    document.getElementById("createmeal").disabled = true;
}

function get_today_recommendation_name() {
    return today_recommendation.name;
}

function send_request(loginfo, func, args, name) {
    var req = { "api_version": API_VERSION };
    for (var i = 0; i < args.length; i++) {
	if (args[i] == "historyId")
	    req["historyId"] = today_recommendation ? today_recommendation.historyId : historyId;
	if (args[i] == "timeslot" && today_recommendation)
	    req["timeslot"] = today_recommendation.timeslot;
	if (args[i] == "name")
	    req["name"] = name;
    }
    console.log("SEND REQ " + loginfo);
    disable_all();
    func(req).execute(function(resp) {
	console.log("RECV RESP " + loginfo);
	console.log(resp);
	today_recommendation_received(resp);
    });
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

function deletemeal() {
    send_request("deletemeal", gapi.client.lunchere.deletemealUnauth, ["historyId", "timeslot"]);
}

function prevmeal() {
    send_request("prevmeal", gapi.client.lunchere.prevmealUnauth, ["historyId", "timeslot"]);
}

function nextmeal() {
    send_request("nextmeal", gapi.client.lunchere.nextmealUnauth, ["historyId", "timeslot"]);
}

function createmeal() {
    // currently dup nextmeal
    send_request("createmeal", gapi.client.lunchere.nextmealUnauth, ["historyId", "timeslot"]);
}

function confirm_today(name) {
    if (today_recommendation && name) {
	send_request("confirm", gapi.client.lunchere.yesUnauth, ["historyId", "timeslot", "name"], name);
    }
    else {
	console.log("ERROR: today_recommendation is None or name is empty but confirm is clicked");
    }
}

function cancel_today() {
    if (today_recommendation) {
	send_request("cancel", gapi.client.lunchere.noUnauth, ["historyId", "timeslot", "name"], get_today_recommendation_name());
    }
    else {
	console.log("ERROR: today_recommendation is None but cancel is clicked");
    }
}
