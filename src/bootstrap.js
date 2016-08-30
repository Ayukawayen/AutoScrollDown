const { classes: Cc, interfaces: Ci, utils: Cu } = Components;

Cu.import('resource://gre/modules/Services.jsm');

var menuId = null;

function loadIntoWindow(window) {
	if (!window)
		return;
	// Add any persistent UI elements
	// Perform any other initialization

	menuId = window.NativeWindow.menu.add({
		name:'Auto Scroll',
	});

	let items = [];
	for(let i=0;i<=10;++i) {
		items.push(i.toString());
	}
	items[0] += '(stop)';
	items[1] += '(slowest)';
	items[10] += '(fastest)';
	
	items.forEach((item, i)=>{
		window.NativeWindow.menu.add({
			name:item,
			parent: menuId,
			callback: function() {
				onMenuItemClick(window, i);
			},
		});
	});
}

function unloadFromWindow(window) {
	if (!window)
		return;
	// Remove any persistent UI elements
	// Perform any other cleanup
	
	if(menuId) {
		window.NativeWindow.menu.remove(menuId);
	}
}

var windowListener = {
	onOpenWindow: function(aWindow) {
		// Wait for the window to finish loading
		let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
		domWindow.addEventListener("UIReady", function onLoad() {
			domWindow.removeEventListener("UIReady", onLoad, false);
			loadIntoWindow(domWindow);
		}, false);
	},
 
	onCloseWindow: function(aWindow) {},
	onWindowTitleChange: function(aWindow, aTitle) {}
};

function startup(aData, aReason) {
	// Load into any existing windows
	let windows = Services.wm.getEnumerator("navigator:browser");
	while (windows.hasMoreElements()) {
		let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
		loadIntoWindow(domWindow);
	}

	// Load into any new windows
	Services.wm.addListener(windowListener);
}

function shutdown(aData, aReason) {
	// When the application is shutting down we normally don't have to clean
	// up any UI changes made
	if (aReason == APP_SHUTDOWN)
		return;

	// Stop listening for new windows
	Services.wm.removeListener(windowListener);

	// Unload from any existing windows
	let windows = Services.wm.getEnumerator("navigator:browser");
	while (windows.hasMoreElements()) {
		let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
		unloadFromWindow(domWindow);
	}
}

function install(aData, aReason) {}
function uninstall(aData, aReason) {}

/*  --------------------------------------------  */

function onMenuItemClick(window, speed) {
	let contentWindow = window.content;

	contentWindow.netAyukawatenAutoScrollDown = contentWindow.netAyukawatenAutoScrollDown || buildAutoScrollDown(contentWindow);
	
	let asd = contentWindow.netAyukawatenAutoScrollDown;
	
	if(speed == 0) {
		asd.isEnable = false;
		return;
	}
	
	let args = getScrollArgs(speed, contentWindow.innerHeight/contentWindow.screen.height);

	asd.interval = args.interval;
	asd.px = args.px;
	
	if(!asd.isEnable) {
		asd.isEnable = true;
		asd.tick();
	}
}

function buildAutoScrollDown(window) {
	let result = {
		isEnable:false,
		interval:25,
		px:1,
	}
	result.tick = function() {
		if(!this.isEnable) return;
		
		if(window.scrollY == window.scrollMaxY) {
			this.isEnable = false;
			return;
		}
		
		window.scrollBy(0, this.px);
		window.setTimeout(()=>{window.netAyukawatenAutoScrollDown.tick();}, this.interval);
	}.bind(result);
	
	return result;
}

function getScrollArgs(speed, scale) {
	speed = Math.pow(2, speed/2);
	
	let px = Math.ceil(scale);
	let interval = Math.ceil(px/scale*100/speed);
	while(interval<25) {
		++px;
		interval = Math.ceil(px/scale*100/speed);
	}
	
	return {
		interval:interval,
		px:px,
	};
}
