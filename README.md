fbExec.js
=========

Facebook JavaScript SDK Helper - makes it easier to make FB JS API calls without having to worry about the state (init or loginStatus), and allows you the freedom to place FB dependent code wherever you'd like (vs being restricted to fbAsyncInit); especially useful with client-side routing systems such as backbone.js, ember.js, and sammy.js. Check out the examples below.

##Why would I want to use it?
Facebooks JS SDK provides us with a async init callback function (but it forces us to put all FB JS SDK dependent code within ```window.fbAsyncInit```) shown below:
(doc here - https://developers.facebook.com/docs/reference/javascript/)

####Snippet 1. Facebook's Asynchronous JavaScript SDK.
```html
<div id="fb-root"></div>
<script>
  //Everything below is what Facebook provides for its JS SDK
	window.fbAsyncInit = function() {
		FB.init({
			appId      : 'YOUR_APP_ID',
			channelUrl : '//WWW.YOUR_DOMAIN.COM/channel.html',
			status     : true,
			cookie     : true,
			xfbml      : true
		});
		//
		// ** Facebook JS SDK Dependent Code here **
		//
	};
	//Load the SDK Script Asynchronously
	(function(d){
		var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
		if (d.getElementsById(id)) {return;}
		js = d.createElement('script'); js.id = id; js.async = true;
		js.src = '//connect.facebook.net/en_US/all.js';
		ref.parentNode.insertBefore(js, ref);
	}(document));
</script>
```

If you put FB JS SDK dependent code outside ```window.fbAsyncInit```, you run the risk of the ```FB``` object being undefined (since Facebook JS script can often take over a second to load). Take a look at the problem example below:

####Snippet 2. Facebook login button.
```js
//This jQuery click function is outside of fbAsyncInit
$("#login-button").click(function(){
	FB.login(function(response){
		if (response.authResponse) {
			//logged in
		}
		else {
			//not logged in
		}
	});
});
```

If the above code was placed OUTSIDE of the ```window.fbAsyncInit``` function and the user clicked the login button (#login-button) before the the Facebook script was loaded; ```FB``` would be undefined and the execution would error. Obviously the above is a bit of a silly example, but fbExec gives you the freedom to place FB JS code (especially important with client-side routing) wherever you want without worrying about it's state. Checkout the clientside routing example below


##How does it work?
fbExec makes it simple, so you don't have to worry about the state of the ```FB``` Object. Place the ```fbExec``` function above Facebook's ```window.fbAsyncInit``` and call ```fbExec.init()``` as shown below:

####Snippet 3. Including fbExec.
```html
//Add fbExec script ABOVE Facebook's JS SDK.
<script type='text/javascript' src='/static/fbExec.js'></script>
//FB Async JS SDK
<script type='text.javascript'>
window.fbAsyncInit = function() {
	FB.init({
		appId      : 'YOUR_APP_ID', // App ID
		channelUrl : '//WWW.YOUR_DOMAIN.COM/channel.html', // Channel File
		status     : true, // check login status
		cookie     : true, // enable cookies to allow the server to access the session
		xfbml      : true  // parse XFBML
	});

	// *** Add the line below ***
	// *** Add the line below ***
	// *** Add the line below ***
	fbExec.init();
	// so that fbExec knows when the FB script has initialized
};
(function(d){
	var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
	if (d.getElementsById(id)) {return;}
	js = d.createElement('script'); js.id = id; js.async = true;
	js.src = '//connect.facebook.net/en_US/all.js';
	ref.parentNode.insertBefore(js, ref);
}(document));
</script>
```

Now fbExec is ready to be used wherever you need it. Use ```fbExec.login``` in place of ```FB.login``` as shown below:

####Snippet 4. Using fbExec login button solution.
```js
$("#login-button").click(function(){
	$loginButton = $(this);
	fbExec.login({
		onAccept: function(response){
			//redirect to logged in page..
		},
		onCancel: function(response){
			//user cancelled the login modal..
		},
		toggleLoader: function(loaderOn){
			if(loaderOn)
				$loginButton.html("loading..");
			else
				$loginButton.html("Login with Facebook");
		}
	});
});
```
```fbExec.login``` will ensure that ```FB``` has initialized and run the appropriate function on user accept or cancel. If the ```FB``` has not initialized and if you've provided ```toggleLoader```, ```fbExec``` will pass ```true``` to ```toggleLoader``` to trigger a loading state (such as setting the login button to read loading, as above). Once ```FB``` has initialized ```fbExec``` will pass your toggle loader ```false``` to turn off the loading state. (Note: ```toggleLoader``` is optional.)

###Client-side Routing Example (Backbone.js)

For those not familiar with backbone.js, let me explain the example below. ```routes:``` specifies the routes of the application and their callback function. For example, navigating to http://myapp.com will execute the ```root``` function; while navigating to http://myapp.com/#home will execute the ```home``` function. Also note, that because the routing is occuring on the client-side the page does not need to make a request to the server (the javascript will catch the http address change and execute the appropriate code). Although, there is still the possibility that a user may manually refresh the page.

Now you may see why ```fbExec``` is so useful for this scenario. Without using ```fbExec```, one would be forced to put all routes' ```FB``` dependent code in FB JS SDK's ```window.fbAsyncInit```.. which would force applying route specific code to all routes (which could cause issues) and be really disorganized.

####Snippet 5. Using fbExec with client-side routing.
```js
// *** Make sure you have Snippet 3 (above) anywhere before your backbone code. ***
var AppRouter = Backbone.Router.extend({
	routes: {
	   ''       : 'root',
	   '/#home' : 'home',
	},
	root : function(){
		$("#login-button").click(function(){
			$loginButton = $(this);
			fbExec.login({
				onAccept: function(response){
					//redirect to the 'home' page
					appRouter.navigate('/#home', {trigger:true});
				},
				onCancel: function(response){
					//user cancelled the login modal..
				},
				toggleLoader: function(loaderOn){
					if(loaderOn)
						$loginButton.html("loading..");           //loading button label
					else
						$loginButton.html("Login with Facebook"); //original button label
				}
			});
		});
		//If we did not have fbExec the code above, would have to live inside window.fbAsyncInit
		//  as result it would be applied to all routes..
	},
	home : function(){
		//Since the user was logged in on root.. we can use ifLoginStatus just to make sure
		// that the user is logged in and redirect if not (or run some other logout code).
		// All FB logged in dependent code should be wrapped within fbExec.ifLoginStatus.
		fbExec.ifLoginStatus({
			loggedIn: function(){
				//if logged in run some FQL query
				var fbQuery =  'SELECT uid FROM user ';
					fbQuery += 'WHERE uid IN (SELECT uid2 FROM friend WHERE uid1 = me()) ';
				FB.api(
					{
					  method: 'fql.query',
					  query: fbQuery
					},
					function(response) {
						//fql query response..
					}
				);//end FB.api
			},
			loggedOut: function(){
				//if logged out redirect the user to the landing page
				window.location("");
			}
		});
	}
});
```
Although I've only shown how to use ```fbExec``` with ```FB``` dependent code within your app's router. You may use it models and views the same way. All FB logged in dependent code should be wrapped within ```fbExec.ifLoginStatus```, and all init dependent code should be wrapped within ```fbExec.ifInit``` (except login code for which ```fbExec.login``` should be used).

##TL;DR
### Facebook's Asynchronous SDK
When using Facebook's Asynchronous SDK, FB SDK dependent code is restricted to ```window.fbAsyncInit```'s scope; this is not always optimal for code organization or functionality. fbExec allows you to put FB JS SDK dependent code wherever needed in your application, and will ensure that it is executed when ```FB``` has initialized (```fbExec.ifInit```). You can also use fbExec to ensure that a user is logged in before running logged in dependent code (```fbExec.ifLoginStatus```). Use ```fbExec.login``` anywhere in your code and fbExec will make sure that the login popup is triggered after ```FB``` has initialized.
###fbExec.ifInit(fn)
```js
/* ifInit
 *
 * @param fn        {Function} function to run after FB has initialized (or run immediately if it already has)
 * @param dontQueue {Boolean } (optional, default:false) if false (and FB has not initialized) fn will be pushed to a queue of functions that will be executed after FB has initialized.
 *                             if true (and FB has not initialized) fn will be forgotten. For true/false if FB is initialized fn will be executed immediately.
 * @return isInit {Boolean} - whether FB JS SDK has initialized or not. (defined above, set to true in this.init())
 */
```
If ```FB``` has not initialized ```fbExec.ifInit(fn)``` pushes ```fn``` to a function queue to be executed after ```FB``` has initialized; Else, if ```FB``` has already initialized, ```fn``` will be invoked immediately. Note: you have to trigger ```fbExec.init()``` manually to notify fbExec when FB JS SDK has initialized (put it in ```fbAsyncInit```, see Snippet 3 above). Most likely this will not need to be used, since the two main functions to be called when unsure if ```FB``` has initialized are ```FB.login``` and ```FB.getLoginStatus``` both of which functionality is provided directly by fbExec as ```fbExec.login``` and ```fbExec.ifLoginStatus``` respectively.
###fbExec.ifLoginStatus(options)
```js
/* ifLoginStatus: checks FB has initialized (if not, queues execution until it has) and runs appropriate function based on fb login status
 *
 * @param options          {Object  }
 * @param .loggedIn        {Function} (optional, default:noOp) executes if user is logged in
 * @param .loggedOut       {Function} (optional, default:noOp) executes if user is logged out (or if not authorized, if .notAuthorized is not provided)
 * @param .notAuthorized   {Function} (optional, default:.loggedOut) executes if the user is not authorized (has not authorized the app)
 * @param forceCheckServer {Boolean } (optional, default:false) forces FB.getLoginStatus to recheck status with server (rather than cache, this can be important bc fb can be logged out via
 *                                    any connect application or facebook.com)
 * @return this - for chaining
 */
```
Verifies the Facebook's login-status and runs the appropriate passed function. If the facebook user is logged-in and your application is authorized the ```loggedIn``` function will be called. If the facebook user is logged-out the ```loggedOut``` function will be called. If the facebook user is logged-in but has not authorized your application the ```notAuthorized``` function will be called. Note that notAuthorized is optional, and if it is not passed fbExec will execute loggedOut in its place.
###fbExec.login(options)
```js
/* login: checks if FB has initialized (if not, queues triggering popup modal until it has) and runs appropriate function based on user's reaction to login popup.
 *
 * @param options        {Object  }
 * @param .onAccept      {Function} (optional, default:noOp) executes if user accepts login popup
 * @param .onCancel      {Function} (optional, default:noOp) executes if user cancels login popup
 * @param .toggleLoader  {Function} (optional, default:noOp) if FB has not initialized it executes immediately (toggleLoader(true)) to turn a loading state on and then executes again after FB has initialized to turn. See Snippet 4 example and description.
 *                       off the loading state (toggleLoader(false)); if fb has initialized toggle loader is not needed. (See Snippet 5 in Readme.md)
 * @param force          {Boolean } (optional, default:false) forces FB.getLoginStatus to recheck status with server (rather than cache, this can be important bc fb can be logged out via
 *                       any connect application or facebook.com)
 * @return this - for chaining
 */
 ```
Checks if ```FB``` has initialized (if not, queues triggerring the login popup until after ```FB``` has initialized) and runs the appropriate function based on user's reaction to login modal.
###fbExec.init()
```js
/* init: call this when FB is known to be initialized (in window.fbAsyncInit - see Facebook JS SDK asynchronous documentation - or examples in README.md)
 *
 * @return this - for chaining
 */
```
This should be called when FB is known to be initialized (in window.fbAsyncInit - see Facebook JS SDK  asynchronous documentation - or Snippet 3 above). Notifies fbExec that the ```FB``` object has initialized, that the application is ready to run FB JS SDK dependent code, and invokes all functions that have been queued up to run after the object is initialized.
###fbExec.isInit()
```js
/* isInit: whether FB JS SDK has initialized or not.
 *
 * @return isInit {Boolean} - whether FB JS SDK has initialized or not. (defined above, set to true in this.init())
 */
```

###Take a look at the source its short and commented.

License
Released under the MIT license.