<!DOCTYPE html>
<html>
<head>
<title>Lunch from Here</title>
<!-- Python Endpoints: https://developers.google.com/appengine/docs/python/endpoints/ -->
<!-- API Explorer: https://developers.google.com/apis-explorer/ -->
<script>
function initClientIdHistoryId() {
    return {
        "CLIENT_ID": "{{CLIENT_ID}}",
        "historyId": "{{HISTORY_ID}}",
        "API_VERSION": "{{API_VERSION}}"
    };
}
</script>
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
<script src="https://apis.google.com/js/client.js?onload=gapi_ready"></script>
<!-- script src="/js/client.js?onload=lunchere_api_init"></script -->
</head>
<body class="no-confirmed loading initialize no-map no-foursquare no-refreshing">

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
<div id="main-container">
    <div id="title-container">
	<span id="title-text">
	    Tak Kee Chiu Chow<br/>
	    德记海鲜酒家
	</span>
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
	    <div id="title-addr">Chiu Chow restaurant in Sai Wan</div>
	    <div id="costs-container"><i class="icon-money info-icons"></i> <span id="costs">$100-200</span></div><div id="distance-container"><i class="icon-location-arrow info-icons"></i> <span id="distance"> 15min walk</span></div>
	</div><!-- showed only when the small toggle button clicked -->
	<div id="map"></div><!-- showed only when the small toggle button clicked -->
    </div>

    <div id="extra-container">
        <div id="details-buttons">
	    <div id="details">
		<ul>
		    <li id="details-addr-li"><i class="icon-map-marker details-logo"></i><span id="details-addr">G/F, No 3 Belcher's Street</span><span
		    id="details-town">Kennedy Town, Western District</span></li>
		    <li id="details-phonenumber-li">
			<i class="icon-phone details-logo"></i><span id="details-phonenumber">2819 5568</span>
		    </li>
		    <li id="details-hours-li">
			<i class="icon-globe details-logo"></i><span id="details-hours">open until 15:00</span>
		    </li>
		</ul>
	    </div>
	    <div id="buttons">
		<div id="buttons-1" class="disabled"><i class="icon-chevron-up"></i></div>
		<div id="buttons-2" class="disabled"><i class="icon-share-alt"></i></div>
		<div id="buttons-3" class="disabled"><i class="icon-foursquare"></i></div>
		<div id="buttons-last" class="disabled">...</div>
	    </div>
	</div>
	<div id="extra-toggle" class="disabled">
	    <div id="extra-toggle-button">
	        <i id="extra-toggle-button-up" class="icon-chevron-up"></i>
	        <i id="extra-toggle-button-down" class="icon-chevron-down"></i>
	    </div>
	</div>
	<div id="confirmed-footnote">
	    <div id="selected-tag" class="disabled"><i class="icon-ok"></i>SELECTED</div>
	    You selected this place 3 minutes ago.
	</div>
	<div id="footnote">
	    <div id="magic-tag" class="disabled"><i class="icon-magic"></i>MAGIC</div>
	    You haven't been to this place for 21 days.
	</div>
    </div>
    <div id="options">
	<div id="options-captions">
	    <i>Lunch here today?</i>
	    <span id="no-confirmed-info-date"></span>
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
	    <input id="typehere" value="" placeholder="type here" valuesource="type here" ></input>
	    <div id="typehere-search"><i class="icon-search"></i></div>
	</div>
	<div id="delete-this-meal" class="disabled">
	    <i class="icon-trash"></i> delete this meal
	</div>
    </div>
    <div id="confirmed-info">
        <div id="confirmed-info-name">Today's Lunch</div>
	<div id="confirmed-info-date">1st meal of 17 Jul 2013</div>
    </div>
    <div id="review-options">
        <div id="review-reselect" class="disabled"><i class="icon-rotate-left"></i></div>
        <div id="review-thumbs-up" class="disabled"><div id="review-thumbs-up-floater"><i class="icon-thumbs-up"></i></div></div>
        <div id="review-thumbs-down" class="disabled"><div id="review-thumbs-down-floater"><i class="icon-thumbs-down-alt"></i></div></div>
        <div id="review-delete-meal" class="disabled"><i class="icon-trash"></i></div>
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
	<div id="timeline-title"><span id="timeline-title-text">ThursdayWireless</span>'s Timeline</div>
    </div>
    <div id="about">
        <div id="logo">
	    <div id="logo-lunch">Lunch</div>
	    <div id="logo-here">ere</div>
	</div>
	<div id="version"><? readfile("version.txt"); ?></div>
    </div>
</div>

</body>
</html>
