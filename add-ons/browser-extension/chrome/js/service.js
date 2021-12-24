importScripts('/js/shared.js');
console.debug('LSC plugin service initializing');

// Update the extension icon based on the current tab status
api.runtime.onMessage.addListener((message,sender,respond)=>{
	if(message.type!='status') return;
		// Status
	var status=message.status;
	if(status!='') status='-'+status;// Default icon
	api.action.setIcon({
		path:{
	        16:'/img/icon'+status+'-16x16.png',
	        32:'/img/icon'+status+'-32x32.png',
	        48:'/img/icon'+status+'-48x48.png',
	        128:'/img/icon'+status+'-128x128.png'
		},
		tabId:parseInt(sender.tab.id)
	});
	respond(false);
});

console.debug('LSC plugin service initialized');
