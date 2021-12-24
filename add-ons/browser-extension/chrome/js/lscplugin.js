	// Manage the website?
var manage=false;
	// Update the status
const updateStatus=(noTimeout)=>{
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
			api.runtime.sendMessage({type:'status',status:status},()=>{
				if(!noTimeout) setTimeout(updateStatus,500);
			});
		}catch(ex){
			console.log('Stopping LSC plugin status updates (need reload!)',ex);
			if(typeof window.LSC!='undefined'&&LSC&&LSC.instance){
				LSC.instance.store();
				LSC.options.enable=false;
			}
			if(manage) location.reload(false);
		}
	},
	// Manage the website
	manageWebsite=async (message)=>{
		// Prepare
			// Now
		const now=new Date(),
			// Today Unix timestamp
			today=Math.floor(Date.now()/1000);
			// Cache version
		var version=message.pageSettings.refreshDaily?Math.floor(new Date(now.getFullYear(),now.getMonth(),now.getDate())/10000):0;
		// Set settings
		if(LSC.instance){
			// Update the running instance
			if(!message.update){
				// No update, because no settings were changed
				console.debug('No LSC settings changed',message);
				return;
			}
			console.debug('Update running LSC instance',message,version);
			// Handle the cache version
			if(!version&&LSC.instance.getCacheVersion()<today) version=today;
			if(LSC.instance.getCacheVersion()<version){
				console.debug('Clear the LSC cache',version,message);
				LSC.instance.clear(version);
			}else{
				console.debug('Set the LSC cache version',version,message);
				LSC.instance.getCache().set('version',version);
			}
			// Set the storage to use
			await LSC.instance.setSessionStorage(message.pageSettings.session);
		}else{
			// Initialize LSC
			console.debug('Initialize LSC for the website',message,version);
			// Pre-settings
			LSC.options.isPlugin=true;
			LSC.options.useSessionStorage=message.pageSettings.session;
			// Run LSC, if managed
			if(message.manage){
				console.log('Run LSC',message,version,message.settings.prefetch);
				await LSC(null,version,message.settings.prefetch);
				if(version&&version<LSC.instance.getCacheVersion()){
					console.log('Set the LSC cache version',version,LSC.instance.getCacheVersion(),message);
					LSC.instance.getCache().set('version',version);
				}
			}
		}
	};

// Handle the website
if(LSC.instance){
	// Don't disturb the instance the website runs already, but display the status of this running instance
	console.log('LSC plugin will not override a running LSC version #'+LSC.VERSION(),LSC);
	updateStatus();
}else if(!LSC.isContentSupported(document.contentType)){
	// Don't manage
	console.log('LSC plugin will not manage an unknown content type',document.contentType);
	updateStatus(true);
}else{
	// This website can be managed
	console.log('LSC plugin can manage this website');
	updateStatus();
	manage=true;
}

// Handle plugin messages
api.runtime.onMessage.addListener((message,sender,respond)=>{
	(async ()=>{
		switch(message.type){
			case 'manage':
				// Manage the website
				console.debug('LSC plugin management message',message,sender);
				// Update the page settings
				localStorage.setItem('lscPluginSettings',JSON.stringify(message.pageSettings));
				// Break, if not manageable
				if(!manage){
					console.debug('LSC will not manage this website');
					break;
				}
				// Start managing
				await manageWebsite(message);
				break;
			case 'status':
				// Determine and respond the current status
					// Status
				var status='inactive';
				if(
					typeof window.LSC!='undefined'&&
					LSC&&
					LSC.instance&&
					LSC.options&&
					LSC.options.enable&&
					LSC.isContentSupported(document.contentType)
					)
					status=LSC.instance.getFetchCount()?'loading':'active';
				respond(status);
				return;
			case 'clear':
				// Clear the cache
				console.debug('Clear the cache',message,sender);
				if(LSC&&LSC.instance) LSC.instance.clear(LSC.instance.getCacheVersion());
				break;
			case 'update':
				// Update the current page
				console.debug('Update the current page that is managed by LSC',message,sender);
				if(LSC&&LSC.instance){
					respond(
						await LSC.instance.update(location.href,true,false,true)&&
						await LSC.instance.navigate(location.href,true,LSC.instance.getHistoryIndex())
						);
				}else{
					console.warn('Can not update the current page because LSC is not running');
					debugger;
					respond(false);
				}
				return;
			case 'disable':
				// Disable the LSC plugin
				console.debug('Disable LSC',message,sender);
				LSC.options.enable=false;
				// Delete the cache
				(LSC.instance.getSessionStorage()?sessionStorage:localStorage).removeItem(LSC.instance.getKey());
				// Delete the page settings
				localStorage.removeItem('lscPluginSettings');
				// Reload the page
				location.reload(true);
				break;
			case 'settings':
				// Get the LCS plugin settings
				console.debug('LSC page settings requested',message,sender);
					// Settings
				const settings=localStorage.getItem('lscPluginSettings');
				console.debug('Current LSC page settings',settings);
				respond({settings:settings==null?null:JSON.parse(settings),manage:manage});
				return;
			default:
				console.warn('Invalid LSC plugin message',message,sender,respond);
				debugger;
				break;
		}
		respond(false);
	})();
	return true;
});

// Send the page settings anf manage the website, if managed before
(async ()=>{
		// Settings
	const settings=localStorage.getItem('lscPluginSettings');
	if(settings!=null) console.debug('Initial LSC page settings',settings);
	if(manage&&settings!=null) await manageWebsite({
			settings:await api.storage.sync.get(defaultSettings),
			pageSettings:JSON.parse(settings),
			manage:true
		});
	await api.runtime.sendMessage({type:'settings',settings:settings==null?null:JSON.parse(settings),manage:manage});
})();
