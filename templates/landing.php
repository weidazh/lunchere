<!DOCTYPE html>
<html>
<head>
<title>Lunch where</title>
<link rel="stylesheet" href="/css/landing.css" />
<link href="//netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css" rel="stylesheet">
<link rel="stylesheet" href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/themes/smoothness/jquery-ui.min.css">
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min.js"></script>
<script src="/js/private.js"></script>
<script src="/js/foursquare.js"></script>
<script src="/js/core.js"></script>
<script src="/js/modules/spin.min.js"></script>
<script src="/js/landing.js"></script>
</head>
<body>
<div id="above-container">
<div id="center-container" class="container">
    <div id="above-logo"></div>
    <div id="recent-timlines-container">
        Your recent timelines:
	<ul id="recent-timelines">
	</ul>
    </div>
    <div id="page-container" class="container">
	or create a new one:
	<div id="location-container" class="container">
	    <input id="location" placeholder="street, city, state, country" /><div id="arrow-overlay">
		<i id="arrow" class="icon-location-arrow enabled"></i>
	    </div><div id="status-overlay"><!--
	     --><i id="error-warning" class="icon-warning-sign"></i><!--
	     --><div id="spinner"></div><!--
	     --><span id="spinner-alternative"><i class="icon-spinner"></i></span>
	    </div>
	</div>
	<button id="find" class="disabled" disabled>find lunch</button>
    </div>
</div>
</div>
<div id="footer-container">
    <div id="about">
        <div id="logo">
	    <div id="logo-lunch">Lunch</div>
	    <div id="logo-here">ere</div>
	</div>
	<div id="version"><? ?></div>
    </div>
</div>
</body>
</html>
