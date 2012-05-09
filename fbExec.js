fbExec = (function(){
  //private vars, functions
  var noOp               = function(){},
      isInit             = false,
      loginAlreadyQueued = false,
      onInitQueue   = [],
      runQueue = function(queue){
        while (queue.length) {
          ( queue.shift() )(); //'pops' queue[0] and invokes it.
        }
      },
      runInitQueue = function(){
        runQueue(onInitQueue);
      },
      loggedOutFunction;
  //public functions
  return {
    /* init: call this when FB is known to be initialized (in window.fbAsyncInit - see Facebook JS SDK asynchronous documentation - or examples in README.md)
     *
     * @return this - for chaining
     */
    init: function(){
      isInit = true;
      runInitQueue();
      return this;
    },
    /* isInit: whether FB JS SDK has initialized or not.
     *
     * @return isInit {Boolean} - whether FB JS SDK has initialized or not. (defined above, set to true in this.init())
     */
    isInit: function(){
      return isInit;
    },
    /* ifInit
     *
     * @param fn        {Function} function to run after FB has initialized (or run immediately if it already has)
     * @param dontQueue {Boolean } (optional, default:false) if false (and FB has not initialized) fn will be pushed to a queue of functions that will be executed after FB has initialized.
     *                             if true (and FB has not initialized) fn will be forgotten. For true/false if FB is initialized fn will be executed immediately.
     * @return isInit {Boolean} - whether FB JS SDK has initialized or not. (defined above, set to true in this.init())
     */
    ifInit: function(fn, dontQueue){
      if (!fn) {
        fn = function(){};
      }
      if (isInit) {
        fn();
        return true; //isInit
      }
      else {
        if (!dontQueue) {
          ifInitQueue.push(fn);
        }
        return false; //isInit
      }
    },
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
    ifLoginStatus: function(options, forceCheckServer){
      var fnLoggedIn      = options.loggedIn      || noOp,
          fnLoggedOut     = options.loggedOut     || noOp,
          fnNotAuthorized = options.notAuthorized || fnLoggedOut;
      forceCheckServer    = forceCheckServer      || false;
      this.ifInit(function(){
        FB.getLoginStatus(function(response){
          if (response.status === 'connected') {
            // the user is logged in and has authenticated your
            // app, and response.authResponse supplies
            // the user's ID, a valid access token, a signed
            // request, and the time the access token
            // and signed request each expire
            fnLoggedIn(response);
          } else if (response.status === 'not_authorized') {
            // the user is logged in to Facebook,
            // but has not authenticated your app
            fnNotAuthorized(response);
          } else {
            // the user isn't logged in to Facebook.
            fnLoggedOut(response);
          }
        }, forceCheckServer); //FB.getLoginStatus
      }); //this.ifInit
      return this;
    },
    /* login: checks if FB has initialized (if not, queues triggering popup modal until it has) and runs appropriate function based on user's reaction to login popup.
     *
     * @param options        {Object  }
     * @param .onAccept      {Function} (optional, default:noOp) executes if user accepts login popup
     * @param .onCancel      {Function} (optional, default:noOp) executes if user cancels login popup
     * @param .toggleLoader  {Function} (optional, default:noOp) if FB has not initialized it executes immediately (toggleLoader(true)) to turn a loading state on and then executes again after FB has initialized to turn
     *                       off the loading state (toggleLoader(false)); if fb has initialized toggle loader is not needed. (See Snippet 5 in Readme.md)
     * @param force          {Boolean } (optional, default:false) forces FB.getLoginStatus to recheck status with server (rather than cache, this can be important bc fb can be logged out via
     *                       any connect application or facebook.com)
     * @return this - for chaining
     */
    login: function(options, forceIntoQueue){
      var onAccept     = options.onAccept     || noOp,
          onCancel     = options.onCancel     || noOp,
          toggleLoader = options.toggleLoader || noOp;
      if (!loginAlreadyQueued || forceIntoQueue) { //loginAlreadyQueued is defined at the top.
        toggleLoader(true); //toggle loading state on until FB initializes
        //ifInit returns true if the function was executed and false if the function was queued
        loginAlreadyQueued = !this.ifInit(function(){
          toggleLoader(false); //FB has initialized, toggle loading state off. popup is triggerred.
          FB.login(function(response){
            if (response.authResponse) {
              //logged in
              onAccept(response);
            }
            else {
              //user cancelled
              onCancel(response);
            }
          });
          loginAlreadyQueued = false;
        });
      }
      return this;
    }
  };
})();