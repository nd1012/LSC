	// Update the status
const updateStatus=async (noTimeout)=>{
			// Status
		var status;
		if(
			typeof window.LSC=='undefined'||
			!LSC||
			!LSC.options||
			!LSC.options.enable||
			!LSC.isContentSupported(document.contentType)
			){
			// Not loaded (error!), unloaded, disabled or unsupported content type
			status='inactive';
		}else if(!LSC.instance){
			// No instance yet
			status=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'';
		}else if(LSC.instance.getFetchCount()){
			// No instance yet or fetching contents
			status='loading';
		}else{
			// Active
			status='active';
		}
		try{
			await api.runtime.sendMessage(status);
			if(!noTimeout) setTimeout(updateStatus,500);
		}catch(ex){
			console.debug('Stopping LSC plugin status updates (need reload! //TODO)',ex);
		}
	};
// Handle the website
if(LSC.instance){
	// Don't disturb the instance the website runs already, but display the status of this running instance
	console.log('LSC plugin will not override a running LSC version #'+LSC.VERSION(),LSC);
	updateStatus(true);
}else if(!LSC.isContentSupported(document.contentType)){
	// Don't manage
	console.log('LSC plugin will not manage an unknown content type',document.contentType);
	updateStatus();
}else{
	// Handle plugin messages
	api.runtime.onMessage.addListener(async (message,sender,respond)=>{
		switch(message.type){
			case 'manage':
				console.debug('LSC plugin management message',message,sender);
					// Now
				const now=new Date(),
					// Today Unix timestamp
					today=Math.floor(Date.now()/1000);
					// Cache version
				var version=message.refreshDaily?Math.floor(new Date(now.getFullYear(),now.getMonth(),now.getDate())/10000):0;
				// Set settings
				if(LSC.instance){
					// Update the running instance
					if(!message.update) return;// No update, because no settings were changed
					console.debug('Update running LSC instance');
					if(!version&&LSC.instance.getCacheVersion()<today)
						version=today;
					if(LSC.instance.getCacheVersion()<version){
						LSC.instance.clear(version);
					}else{
						LSC.instance.getCache().set('version',version);
					}
					await LSC.instance.setSessionStorage(message.session);
				}else{
					// Initialize LSC
					console.debug('Initialize LSC for the website');
					LSC.options.isPlugin=true;
					LSC.options.useSessionStorage=message.session;
					await LSC(null,version,message.options.prefetch);
					if(version&&version<LSC.instance.getCacheVersion())
						LSC.instance.getCache().set('version',version);
				}
				break;
			case 'status':
				// Determine and respond the current status
					// Status
				var status='inactive';
				if(
					LSC.instance&&
					LSC.options&&
					LSC.options.enable&&
					LSC.isContentSupported(document.contentType)
					)
					status=LSC.instance.getFetchCount()?'loading':'active';
				respond(status);
				return true;
			case 'clear':
				// Clear the cache
				if(LSC&&LSC.instance) LSC.instance.clear(LSC.instance.getCacheVersion());
				break;
			case 'disable':
				// Disable the LSC plugin
				LSC.options.enable=false;
				(LSC.instance.getSessionStorage()?sessionStorage:localStorage).removeItem(LSC.instance.getKey());
				location.reload(true);
				break;
			default:
				console.warn('Invalid LSC plugin message',message,sender,respond);
				break;
		}
	});
	// Run the status update
	updateStatus();
}
