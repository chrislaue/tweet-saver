_______________________________________________________________________________
			___       ___  ___ ___     __             ___  __  
			 |  |  | |__  |__   |     /__`  /\  \  / |__  |__) 
			 |  |/\| |___ |___  |     .__/ /~~\  \/  |___ |  \ 
_______________________________________________________________________________

INSTRUCTIONS :

	Tweet Saver - 
	Create a one page webapp that allows users to save tweets to HTML 5 local 
	storage by dragging and dropping.

	Users can follow a twitter stream by putting in some text into a search 
	field. You can use this url to get the twitter data:
	http://search.twitter.com/search.json?q=search%20terms

	Details for the API can be found here:
	https://dev.twitter.com/docs/api/1/get/search

	A column on the left hand side of the page then gets populated with the 10
	most recent twitter posts matching that criteria.

	The user can then drag and drop tweets from the left hand column to column
	on the right labelled saved tweets. The saved tweets will get automatically
	saved in the page such that when the user refreshes the page, his saved
	tweets are still present.

	The application only needs to support HTML 5 compliant browsers. You can
	use any javascript libraries you like.


NOTES ON SUBMISSION :

	SETUP : 
	
	Mount on any web server. I used a super simple Node.js/Express set up on
	my local machine when developing. If you have Node.js and Express installed
	you can run the index.js file and hit the root of your localhost/IP at port 
	1234. 
	
	Also have tested by dropping the folder in as a subfolder on an existing
	Apache setup and it worked. 
	
	I used relative paths for the inclusion of CSS/JS and the Ajax call to grab
	the template used so mounting it as mentioned above shouldn't pose any 
	issue.

	Project uses the following libraries/frameworks:

		jQuery : http://api.jquery.com/
		Twitter Bootstrap : http://twitter.github.com/bootstrap/
		Twitter Text : https://github.com/twitter/twitter-text-js/
		Hogan : http://twitter.github.com/hogan.js/
		

	Tested against Chrome, Safari, Firefox and IE9. Even though IE8 purportedly
	supports native drag and drop, I did not get it to work. IE9 works with a 
	caveat - dragging the avatar to the right column works, but expected 
	behaviour of being able to drag the tweet's container does not work. Not 
	enough time to come up with a workaround.
	
	Had an interesting situation with the data attribute and jQuery's 
	.data() which prompted a move to using the tweets index to map against the 
	result set in memory (displayed search results). Using the supplied
	property of "id_str" as the data attributes value and the .data() method
	resulted the method assuming the value was a number causing issues with the
	values interpretation. Interesting, as in retrospect I could have employed
	.getAttribute() and be fully supported in the browsers I tested against.

_______________________________________________________________________________