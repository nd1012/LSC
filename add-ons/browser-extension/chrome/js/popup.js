// Add event listeners
window.addEventListener('load',async ()=>{
	console.debug('Initialize LSC plugin popup');
		// Paused?
	var paused=false;
		// Website displya area
	const website=document.getElementById('website'),
		// No website display area
		noWebsite=document.getElementById('nowebsite')
		// Status element
		statusElement=document.getElementById('status'),
		// Regular expression to match a http(s) URI
		rxHttp=/^https?\:\/\//i,
		// Get the current tab
		currentTab=async ()=>(await api.tabs.query({active:true,currentWindow:true}))[0],
		// Change the extension icon
		changeIcon=(icon,tab)=>{
			api.action.setIcon({
				path:{
			        16:'/img/icon'+icon+'-16x16.png',
			        32:'/img/icon'+icon+'-32x32.png',
			        48:'/img/icon'+icon+'-48x48.png',
			        128:'/img/icon'+icon+'-128x128.png'
			    },
			    tabId:tab
			});
		},
		// Set a status
		setStatus=async (status,icon,tab)=>{
			if(tab==(await currentTab()).id&&statusElement.className!=status){
				console.log('Update popup status',status,icon,tab);
				statusElement.innerText=i18n_translate(status+'Info',true);
				statusElement.className=status;
			}
			if(icon) changeIcon(status==''?'':'-'+status,tab);
		},
		// Status update
		updateStatus=async ()=>{
				// Active tab
			const tab=await currentTab();
			console.debug('Update the LSC status',tab);
			if(!rxHttp.test(tab.url.toLowerCase())){
				// Inactive
				console.log('LSC is inactive for the current tab URI',tab);
				await setStatus('inactive',true,tab.id);
				return;
			}
			await api.tabs.sendMessage(tab.id,{type:'status'},null,(status)=>{
				console.debug('Received LSC status response',status,tab);
				setStatus(status,true,tab.id);
			});
		},
		// Manage the active tab
		manageTab=async (noUpdate)=>{
			console.debug('Manage tab from LSC plugin',noUpdate);
			if(paused){
				// Not managed while paused
				console.debug('LSC plugin is paused');
				return;
			}
				// Tab to manage
			const tab=await currentTab(),
				// Manage the active tab?
				manage=rxHttp.test(tab.url.toLowerCase()),
				// Message
				msg=manage
					?{
						// Message type
						type:'manage',
						// Settings
						settings:await api.storage.sync.get(defaultSettings),
						// Page settings
						pageSettings:{},
						// Is an update because of settings changed?
						update:!noUpdate&&!paused,
						// Manage the active tab?
						manage:manage
					}
					:null;
			// Copy active tab options to the message
			for(let key of pageSettingsKeys) msg.pageSettings[key]=document.getElementById(key).checked;
			// Update the popup display
			(manage?website:noWebsite).removeAttribute('hidden');
			(manage?noWebsite:website).setAttribute('hidden','hidden');
			// Send the message to the active tab, if it has a http(s) URI
			console.debug('Send message to LSC plugin',msg,tab);
			await api.tabs.sendMessage(tab.id,msg);
			// Update the status
			await updateStatus();
		},
		// Plugin settings
		settings=await api.storage.sync.get(settingsKeys),
		// Update the page settings
		updatePageSettings=async (pageSettings)=>{
			if(!pageSettings) return;
			console.debug('Update LSC page settings',pageSettings);
				// Plugin settings
			const pluginSettings=await api.storage.sync.get(settingsKeys);
			paused=true;
			document.getElementById('session').checked=typeof pageSettings.session!='undefined'
				?pageSettings.session
				:pluginSettings.session;
			document.getElementById('refreshDaily').checked=typeof pageSettings.refreshDaily!='undefined'
				?pageSettings.refreshDaily
				:pluginSettings.refreshDaily;
			paused=false;
		};
	// Pre-set page settings
	console.debug('Pre-set page settings from global plugin settings',settings);
	await updatePageSettings(settings);
	// Manage the active tab when options changed
	for(let id of pageSettingsKeys) document.getElementById(id).addEventListener('change',()=>manageTab());
	// Listen to messages from the plugin
	api.runtime.onMessage.addListener((message,sender,respond)=>{
		(async ()=>{
			switch(message.type){
				case 'status':
					// Status update
					await setStatus(message.status,true,sender.tab.id);
					break;
				case 'settings':
					// Page settings
					console.debug('Received page settings',message);
					await updatePageSettings(message.settings);
					await manageTab(!message.manage);
					break;
			}
			respond(false);
		})();
		return true;
	});
	// Reload when the user clicked the disable button
	document.getElementById('disable').addEventListener(
		'click',
		async ()=>{
			console.debug('Disable LSC requested');
			await api.tabs.sendMessage((await currentTab()).id,{type:'disable'});
			close();
		}
		);
	// Clear the cache when the user clicked the "Clear cache" button
	document.getElementById('clear').addEventListener(
		'click',
		async ()=>{
			console.debug('Clear LSC cache requested');
			await api.tabs.sendMessage((await currentTab()).id,{type:'clear'});
			alert(i18n_translate('cacheCleared',true));
		}
		);
	// Update the cache for the current page when the user clicked the "Update page" button
	document.getElementById('update').addEventListener(
		'click',
		async ()=>{
			console.debug('LSC update current page requested');
			await api.tabs.sendMessage((await currentTab()).id,{type:'update'},(res)=>{
				if(res){
					close();
					return;
				}
				console.error('Update LSC cache for the current page failed',res);
				alert(i18n_translate('updateFailed',true))
			});
		}
		);
	// Close the popup when the user clicked the close button
	document.getElementById('close').addEventListener('click',()=>close());
	// Translate the page
	i18n_translate(false,false,true);
	// Get the current status
	console.debug('Update initial LSC status');
	await updateStatus();
	// Get the page settings
	await api.tabs.sendMessage((await currentTab()).id,{type:'settings'},(res)=>{
		console.log('Received initial LSC page settings',res);
		updatePageSettings(res.settings).then(()=>manageTab(!res.manage));
	});
	console.debug('LSC plugin popup initialized');
});
