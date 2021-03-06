<!DOCTYPE html>
<html>
<head>
<title>Lunchere for {{TIMELINE_NAME }} </title>
<!-- Python Endpoints: https://developers.google.com/appengine/docs/python/endpoints/ -->
<!-- API Explorer: https://developers.google.com/apis-explorer/ -->
<script>
function initClientIdHistoryId() {
    return {
        "CLIENT_ID": "{{CLIENT_ID}}",
        "historyId": "{{HISTORY_ID}}",
        "API_VERSION": "{{API_VERSION}}",
        "LL": "{{LL}}",
        "NEAR": "{{NEAR}}",
	"TIMELINE_ID": "{{TIMELINE_ID}}",
	"TIMELINE_NAME": "{{TIMELINE_NAME}}",
    };
}
</script>
<link rel="shortcut icon" href="/favicon.png" />
<link href="//netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css" rel="stylesheet">
<link rel="stylesheet" href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/themes/smoothness/jquery-ui.min.css">
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min.js"></script>
<link rel="stylesheet" href="/css/main.css" />
<script src="/js/core.js"></script>
<script src="/js/private.js"></script>
<script src="/js/foursquare.js"></script>
<script src="/js/modules/spin.min.js"></script>
<script src="/js/main.js"></script>
<!-- script src="https://apis.google.com/js/client.js?onload=gapi_ready"></script -->
<!-- script src="/js/client.js?onload=lunchere_api_init"></script -->
</head>
<body class="no-confirmed loading initialize no-map no-foursquare no-refreshing">

<div id="above-container">
<div id="old-container">
    <a href="#new">Try new version</a>
    <button id="logout">Log out</button>
    <p>History ID: <span id="historyId">undefined</span></p>
    <p>Timeslot: <button id="deletemeal">Del meal</button><button id="prevmeal">Prev</button> <span id="timeslot">undefined</span> <button id="nextmeal">Next</button><button id="createmeal">Create meal</button></p>
    <p>Today we go to: <span id="today">loading ...</span><span id="confirmed"></span>
    <button id="yes">OK</button>
    <button id="no">Em... maybe another one</button></p>
    <p>Tell the system where you go: <input id="newplace"></input><input id="addr" disabled></input><button id="go">Go</button></p>
</div>


<div id="root-others">
    <a href="#old">Go back old version</a>
    <button id="toggle-info-map"><i class="icon-caret-down"></i></button>
    <div id="api-loading-text"></div>
</div>
<div id="root-container" class="container">
<div id="main-icon" ><div class="loading-placeholder"></div></div><!-- what icon to show ? -->
<div id="main-container" class="f4sq-no-icon f4sq-no-ratings f4sq-no-addr f4sq-no-price f4sq-no-distance f4sq-no-ll f4sq-no-contact f4sq-no-hours f4sq-no-url no-details-buttons">
    <div id="title-container">
	<span id="title-text"></span>
	<span id="title-source"></span>
	<span id="title-loading"></span>
    </div>

    <div id="info-map">
	<div id="info">
	    <div id="ratings-container">
		<div id="ratings">
		    <i id="heart-1" class="icon-star"></i>
		    <i id="heart-2" class="icon-star"></i>
		    <i id="heart-3" class="icon-star"></i>
		    <i id="heart-4" class="icon-star-half-empty"></i>
		    <i id="heart-5" class="icon-star-empty"></i>
		</div>
	    </div>
	    <div id="title-addr"></div>
	    <div id="distance-container"><i class="icon-location-arrow info-icons"></i> <span id="distance"></span></div>
	    <div id="costs-container"><i class="icon-money info-icons"></i> <span id="costs"></span></div>
	</div><!-- showed only when the small toggle button clicked -->
	<div id="map"></div><!-- showed only when the small toggle button clicked -->
    </div>

    <div id="extra-container">
        <div id="details-buttons">
	    <div id="details">
		<ul>
		    <li id="details-addr-li"><i class="icon-map-marker details-logo"></i><span id="details-addr"></span><span
		    id="details-town"></span></li>
		    <li id="details-phonenumber-li">
			<i class="icon-phone details-logo"></i><span id="details-phonenumber"></span>
		    </li>
		    <li id="details-hours-li">
			<i class="icon-time details-logo"></i><span id="details-hours"></span>
		    </li>
		</ul>
	    </div>
	    <div id="buttons">
		<div id="buttons-1" class="disabled"><i class="icon-angle-up"></i></div>
		<div id="buttons-2" class="disabled"><i class="icon-share-alt"></i></div>
		<a id="buttons-3" class="disabled" target="_blank"><i class="icon-foursquare"></i></a>
		<div id="buttons-last" class="disabled">...</div>
	    </div>
	</div>
	<div id="extra-toggle" class="disabled">
	    <div id="extra-toggle-button">
	        <i id="extra-toggle-button-up" class="icon-angle-up"></i>
	        <i id="extra-toggle-button-down" class="icon-angle-down"></i>
	    </div>
	</div>
    </div>
    <div class="container">
	<div id="confirmed-footnote">
	    <div id="selected-tag" ><i class="icon-ok"></i> SELECTED</div>
	    You selected this meal.
	</div>
	<div id="footnote">
	    <div id="magic-tag" ><i class="icon-magic"></i> MAGIC</div>
	    This meal is recommended by <span id="recommendation-source">Lunchere</span>
	</div>
    </div>
</div><!-- main-container -->
</div><!-- root-container -->
    <div id="big-buttons-container" class="container">
        <div><div id="big-left" ><div><i id="big-left-button"  class="disabled" class="icon-arrow-left"></i></div></div></div>
        <div><div id="big-right"><div><i id="big-right-button" class="disabled" class="icon-plus"></i></div></div></div>
    </div>
    <div class="container" id="meal-container">
	<div id="options">
	    <div id="options-captions">
		<div id="no-confirmed-info-question">Lunch here today?</div>
		<div id="no-confirmed-info-date"></div>
		<!-- <br/>
		or <input id="typehere" value="type here" valuesource="type here" ></input><br/>
		   <u id="askfriends">ask friends</u>
		   -->
	    </div>
	    <div id="options-yes-container">
		<div id="options-yes" class="disabled"><i class="icon-ok"></i></div>
	    </div>
	    <div id="options-no-container">
		<div id="options-no" class="disabled"><i class="icon-remove"></i></div>
	    </div>
	</div><!-- showed only in non-confirmed mode -->
	<div id="extra-options" class="container">
	    <div id="typehere-container" class="container">
		<div id="typehere-autocomplete-container"></div>
		<div id="typehere-text">type here: </div>
		<input id="typehere" value="" placeholder="where you wanna go?" valuesource="type here" ></input>
		<div id="typehere-search"><i class="icon-chevron-right"></i></div>
	    </div>
	    <div id="delete-this-meal" class="disabled">
		<i class="icon-trash"></i> delete this meal
	    </div>
	</div>
	<div id="confirmed-info">
	    <div id="confirmed-info-name">Today's Lunch</div>
	    <div id="confirmed-info-date"></div>
	</div>
	<div id="review-options">
	    <div id="review-thumbs-up" class="disabled"><div id="review-thumbs-up-floater"><i class="icon-thumbs-up"></i></div></div>
	    <div id="review-reselect" class="disabled"><i class="icon-rotate-left"></i></div>
	    <div id="review-delete-meal" class="disabled"><i class="icon-trash"></i></div>
	    <div id="review-thumbs-down" class="disabled"><div id="review-thumbs-down-floater"><i class="icon-thumbs-down-alt"></i></div></div>
	</div>
    </div>
</div>

<div id="footer-container">
    <div id="timeline-container">
        <div id="timeline-floater" class="container">
	    <div class="timeline-block left">
		<div class="timeline-label"></div>
		<div id="timeline-button-left" class="timeline-button disabled"><i class="icon-arrow-left"></i></div>
	    </div>
	    <div class="timeline-block left">
		<div class="timeline-label"></div>
		<div class="timeline-button disabled"><i class=""></i></div>
	    </div>
	    <div class="timeline-block left">
		<div class="timeline-label"></div>
		<div class="timeline-button disabled"><i class=""></i></div>
	    </div>
	    <div class="timeline-block left">
		<div class="timeline-label"></div>
		<div class="timeline-button disabled"><i class=""></i></div>
	    </div>
	    <div class="timeline-block left">
		<div class="timeline-label"></div>
		<div class="timeline-button disabled"><i class=""></i></div>
	    </div>
	    <div class="timeline-block center">
		<div class="timeline-label-center"></div>
		<div class="timeline-button-center disabled"><i class="icon-ok"></i></div>
	    </div>
	    <div class="timeline-block right">
		<div class="timeline-label"></div>
		<div class="timeline-button disabled hidden"><i class=""></i></div>
	    </div>
	    <div class="timeline-block right">
		<div class="timeline-label"></div>
		<div class="timeline-button disabled hidden"><i class=""></i></div>
	    </div>
	    <div class="timeline-block right">
		<div class="timeline-label"></div>
		<div class="timeline-button disabled hidden"><i class=""></i></div>
	    </div>
	    <div class="timeline-block right">
		<div class="timeline-label"></div>
		<div class="timeline-button disabled hidden"><i class=""></i></div>
	    </div>
	    <div class="timeline-block right">
		<div class="timeline-label"></div>
		<div id="timeline-button-right" class="timeline-button disabled"><i class="icon-plus"></i></div>
	    </div>
	</div>
	<div id="timeline-title"><div id="timeline-title-text">{{ TIMELINE_NAME }}</div><input id="timeline-title-input" value=""/> Timeline</div>
    </div>
    <? include "footer.inc.php" ?>
</div>

</body>
</html>
