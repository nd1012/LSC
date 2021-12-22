// Browser API
const api=(()=>{
	switch(true){
		case typeof chrome!='undefined':
			return chrome;
		case typeof msBrowser!='undefined':
			return msBrowser;
		default:
			return browser;
	}
})();

// Default settings
const defaultSettings={
	prefetch:true,
	session:false,
	refreshDaily:false
};

// Settings keys
const settingsKeys=Object.keys(defaultSettings);
