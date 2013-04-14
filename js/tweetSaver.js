/*
*	Tweet Saver - 
*	Create a one page webapp that allows users to save tweets to HTML 5 local 
*	storage by dragging and dropping.
*
*	Users can follow a twitter stream by putting in some text into a search 
*	field. You can use this url to get the twitter data:
*	http://search.twitter.com/search.json?q=search%20terms
*
*	Details for the API can be found here:
*	https://dev.twitter.com/docs/api/1/get/search
*
*	A column on the left hand side of the page then gets populated with the 10
*	most recent twitter posts matching that criteria.
*
*	The user can then drag and drop tweets from the left hand column to column
*	on the right labelled saved tweets. The saved tweets will get automatically
*	saved in the page such that when the user refreshes the page, his saved
*	tweets are still present.
*
*	The application only needs to support HTML 5 compliant browsers. You can
*	use any javascript libraries you like.
*/

function tweetSaver(opts) {
	// check if opts was passed in as an object, if not, create a new object.
	opts = typeof opts === "object" ? opts : {};
	// Set defaults if they haven't been overwritten in the passed arg.
	opts.template = opts.template || "templates/tweet.html";
	opts.resultElement = opts.resultElement || "#search-results";
	opts.cachedResults = opts.cachedResults || "#saved-tweets";
	opts.limit = opts.limit || 10;
	opts.noresult = opts.noresult || 'No results found for <strong>"{{query}}"</strong>';
	// Convert noresult into a compiled template.
	opts.noresult = Hogan.compile(opts.noresult);
	opts.alert =  opts.alert || '<div class="alert alert-{{type}}">{{{message}}}</div>';
	// Convert the alert into a compiled template.
	opts.alert = Hogan.compile(opts.alert);
	// var declaration
	var stringTemplate,
		single,
		multiple,
		tempStorage;


	function processSaved() {
		// check for localStorage object.
		if(window.localStorage) {
			// localStorage exists - check the length.
			var len = window.localStorage.length;
			if(len > 0) {
				// clear out the cachedResults panel.
				$(opts.cachedResults).empty();
			}
			for(var i = 0; i < len; i++) {
				// iterate through the localStorage and render the tweets.
				var tweet = JSON.parse(window.localStorage.getItem(localStorage.key(i)));
				// inject three lambdas into the returned object to link the text.
				tweet.link_from_user = lambda_user;
				tweet.link_text = lambda_text;
				tweet.tweet_date = lambda_date;
				tweet.reply_to = lambda_replyTo;
				// append the item into the cachedResults container.
				$(opts.cachedResults).append(single.render(tweet));
			}
		}
	}

	/*
	*	setTemplate populates the following variables:
	*		stringTemplate : the raw response from getTemplate's ajax call.
	*		single : compiled template to handle single tweet renders.
	*		multiple : compiled template to handle an array (group) of tweets.
	*
	*	Also makes a call to processSaved to check if any saved tweets exist in the
	*	localStorage object.
	*/
	function setTemplate(response) {
		// assign the response to the stringTemplate variable.
		stringTemplate = response;
		// assign a compiled template to single (handle single tweets).
		single = Hogan.compile(stringTemplate);
		// augment the string with a group switch and assign as a compiled template
		// to multiple.
		multiple = Hogan.compile("{{#results}}" + stringTemplate + "{{/results}}");
		// make a call to processSaved to render out anything in localStorage
		processSaved();
	}

	/*
	*	Get the template, setTemplate is the callback.
	*/
	function getTemplate(path) {
		// utilize jQuery's Ajax/get to grab the template.
		$.get(path,setTemplate);
	}
	
	/*
	*	renderFromIndex :
	*		Takes an index and returns a rendered tweet if it exists, false if it 
	*		doesn't.
	* 	Optionally accepts a second parameter "store" which, if it evaluates as 
	*		truthy, pushes a string representation of the tweet object into local storage
	*		using the "id_str" property as a key.
	*/
	function renderFromIndex(str,store) {
		// attempt to fetch a tweet object from "storage" (search result object).
		var tweet = getTweetFromStorage(str);
		// check if the tweet is to be saved.
		if (store && tweet["id_str"]) {
			// push the item into storage as a string.
			window.localStorage[tweet.id_str] = JSON.stringify(tweet);
		}
		// inject three lambdas into the object to handle linking text.
		tweet.link_from_user = lambda_user;
		tweet.link_text = lambda_text;
		tweet.tweet_date = lambda_date;
		tweet.reply_to = lambda_replyTo;
		// return either the rendered tweet or false.
		return tweet["id_str"] ? single.render(tweet) : false;
	}
	
	/*
	*	clearAlerts :
	*		removes any alerts in the results panel.
	*		Possible alerts are for a blank search, or if no results are returned
	*		from twitter.
	*/
	function clearAlerts() {
		// grab the result element and find any elements with the ".alert" class
		// and remove.
		$(opts.resultElement).find(".alert").remove();
	}
	
	/*
	*	searchTwitter : 
	*		Accepts a term (string) and initializes a call to twitter, requesting JSONP 
	*		and uses parseResultSet as the callback.
	*/
	function searchTwitter(term) {
		// predefined URL 
		var url = "http://search.twitter.com/search.json?q=";
		// typecheck the term argument and exit out if it isn't.
		if(typeof term !== "string") { 
			return false;
			}
		// encode the term
		term = encodeURIComponent(term);
		url +=term;
		// make the call to get the data using jQuery's method of handling JSONP
		$.getJSON(url+"&rpp="+opts.limit+"&callback=?",parseResultSet);
	}
	
	/*
	*		pluckTweets : 
	*			Accepts an object and determines if it is valid or not. Returns either
	*			the original object with some modifications (results array gets 
	*			truncated to limit defined in options)
	*/

	function pluckTweets(data) {
		// check to see if we have an object, if not, attempt to parse into JSON
		// internal function so not doing any heavy type checking, the argument is 
		// either a string or an object.
		if (typeof data !== "object") {
			data = JSON.parse(data);
		}
		// check to see if twitter returned an error - most typically it's a 0 
		// results error.
		if(data["error"]) {
			// return a dummy object containing the error. Added the query (search
			// terms) as to display a more meaningful error.
			return {
				"query" : data["query"],
				"error" : data["error"],
				"results" : []
			};
		}
		// assign the truncated array to tempStorage, which becomes the object 
		// we use for lookup.
		tempStorage = data["results"];
		// append an index property to the object that occupies the corresponding 
		// spot in the array.
		for(var x = 0; x < tempStorage.length;x++) {
			tempStorage[x].index = x;
		}
		// return the object. Added in the query (searched terms) to the object
		// with the intention of being able to display which terms were searched 
		// to obtain the results.
		return {
			"query" : data["query"],
			"results" : tempStorage
		};
	}
	
	/*
	* 	LAMBDAS for the populating of the template. Mustache accepts a function
	*		with a return value for manipulating object properties when populating
	*		(rendering) templates. 
	*		In this case - it's to link any linkable items (hashtags, users, links.)
	*		These lambdas utilize the twitter-text library, provided by twitter for 
	*		processing tweet text.
	*
	*/

	function lambda_user() {
		return twttr.txt.autoLink("@"+this.from_user)
	}
	function lambda_text() {
		return twttr.txt.autoLink(this.text);
	}
	function lambda_replyTo() {
		var replyToLink;
		if(this.in_reply_to_status_id) {
			replyToLink = '<a target="_blank" href="//twitter.com/';
			replyToLink += this.to_user + '/status/';
			replyToLink += this.in_reply_to_status_id_str;
			replyToLink += '"><i class="icon-comment"></i> in reply to</a>';
			return replyToLink; 
		}
		return false;
	}
	/*
	* Slightly modified take on John Resig's prettyDate function. 
	*	http://ejohn.org/blog/javascript-pretty-date/
	*/
	function lambda_date(){
	var date = new Date(this.created_at || ""),
			diff = (((new Date()).getTime() - date.getTime()) / 1000),
			day_diff = Math.floor(diff / 86400);
	if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 ) {
		return;
	}
	return day_diff == 0 && (
			diff < 60 && "just now" ||
			diff < 120 && "1 minute ago" ||
			diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
			diff < 7200 && "1 hour ago" ||
			diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
		day_diff == 1 && "Yesterday" ||
		day_diff < 7 && day_diff + " days ago" ||
		day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago";
}


	/*
	*	getTweetFromStorage : 
	*		Returns an object - if the index is valid, it returns the stored object,
	*		if not it returns a "blank" object.
	*/

	function getTweetFromStorage(index) {
		// if the index exists AND is a number, check if it is a valid index and 
		// return the stored object. If either fail, return a dummy object.
		return index && !isNaN(index) ? tempStorage[index] ? tempStorage[index] : {} : {};
	}
	/*
	*	showError :
	*		Renders and prepends an alert component to the results panel.
	*/	
	function showError(message,type) {
		// clear alerts
		clearAlerts();
		// check if type exists OR default to "info"
		type = type || "info";
		// render an alert with the passed in message and type
		var markup = opts.alert.render({
			"message" : message, 
			"type" : type
			});
		// prepend the alert to the result element.
		$(opts.resultElement).prepend(markup);
	}

	/*
	*	parseResults : 
	*		Accepts an object (from searchTwitter) and adds lambdas as neccessary 
	*		Renders out the entire set of results.
	*/		
	function parseResultSet(data) {
		var markup;
		// call pluckTweets to process the returned object.
		data = pluckTweets(data);
		// ensure there is no error and that results is an array of at least one
		if(!data["error"] && data["results"].length > 0) {
			// inject lamdas for processing text to linked text.
			data.link_from_user = lambda_user;
			data.link_text = lambda_text;
			data.tweet_date = lambda_date;
			data.reply_to = lambda_replyTo;
			// set the moveable flag to true so the index and dragable property are
			// available.
			data.moveable = true;
			// render the object into a string
			markup = multiple.render(data);
		} else {
			// show the error for no results
			showError(opts.noresult.render(data));
			// exit
			return;
		}
		// inject the rendered string into the markup.
		$(opts.resultElement).html(markup);
	}
	/*
	*	"kick-off"	- fetches the template and triggers off any other processes
	*	that can be triggered.
	*/
	getTemplate(opts.template);
	
	/*
	 * 	Expose a limited set of functionality.
	*/
	return {
		search : searchTwitter,
		error : showError,
		get : getTweetFromStorage,
		render : renderFromIndex
	};
}

function checkEmpty(){
	if($("#saved-tweets div").length === 0)
	$("#saved-results .placeholder").fadeIn("fast");
}

/*
*	Using the DOMReady event to instantiate and also bind some events required
*	to make the application work.
*/
$(document).ready(function(){
	// instantiate the tweetSaver
	window["twitSearch"] = new tweetSaver;
	// bind the search functionality to the search button.
	$("#search-button").click(function(){
		// grab the input as an extended element.
		var $search = $("#search");
		// if there is a value
		if ($search.val()) {
			// kick off the search using the value in the input.
			twitSearch.search($search.val());
		} else {
			// if the value evaluates as falsy we show an error.
			twitSearch.error("Please enter a search term!","error");
		}
		// kill any potential default action
		return false;
	});
	/*
	*	Binding drag and drop events to elements as needed.
	*		".tweet" : created elements returned on a successful search
	*		"#saved-results" : the panel where tweets to be saved are dropped.
	*/
	$(".tweet").live("dragstart",function(evt) {
		// grab the data attribute with the index which maps to the result
		// set in memory.
		var id = $(this).data("tweet");
		// set the data to be transferred in the drag.
		evt.dataTransfer.setData("text",""+id);
	});
	
	$("#saved-results").live("dragenter dragover",function(evt) {
		// cancel the default behaviour of the event
		evt.preventDefault();
	});

	$("#saved-results").live("drop",function(evt) {
		// grab the data from the dropped item.
		var tweet_index = evt.dataTransfer.getData("text");
		// attempt to get the tweet object from memory
		tweet = twitSearch.get(tweet_index);
		// check that the id exists AND that the item is not already in the 
		// localStorage object.
		if (tweet["id_str"] && !window.localStorage.getItem(tweet["id_str"])) {
			// remove the first run message.
			$(this).find(".placeholder").hide();
			// render and append the tweet to the saved tweets container.
			$("#saved-results #saved-tweets").append(function() {
				return twitSearch.render(tweet_index,true);
			});
		}
		// kill any potential default action.
		return false;
	});

	// added a way to remove saved tweets - more out of getting tired of 
	// manually clearing the localStorage object than anything.
	$("#saved-tweets .close").live("click",function(){
		  var $this = $(this);
		  // grab the tweet id from the sibling div, not the most elegant way to
		  // do as such, but... unless someones fiddled with the DOM or the template
		  // it's going to be there.
			var tweetId = $($this.siblings()[0]).attr("id").replace("t-","");
			// perform removeItem() with the id (key) passed in.
			window.localStorage.removeItem(tweetId);
			// check if the removed item still exists since (surprisingly) the
			// removeItem() method has no return value. 
			if(!window.localStorage.getItem(tweetId)) {
				// evaluates to true, this item doesn't exist so we fade the parent out
				$this.parent().slideUp(200,function(){
					// and remove it!
					$(this).remove();
					checkEmpty();
				});
			}
	});
});