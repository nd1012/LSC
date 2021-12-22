// Add event listeners
window.addEventListener('load',async ()=>{
		// Options keys
	const optionsKeys=Array.from(document.querySelectorAll('input:not([type="button"])')).flatMap((i)=>i.id),
		// Website displya area
		website=document.getElementById('website'),
		// No website display area
		noWebsite=document.getElementById('nowebsite')
		// Status element
		statusElement=document.getElementById('status'),
		// Regular expression to match a http(s) URI
		rxHttp=/^https?\:\/\//i,
		// Get the current tab
		currentTab=async ()=>(await api.tabs.query({active:true,currentWindow:true}))[0],
		// Manage the active tab
		manageTab=async (noUpdate)=>{
				// Tab to manage
			const tab=(await api.tabs.query({active:true,currentWindow:true}))[0],
				// Manage the active tab?
				manage=rxHttp.test(tab.url.toLowerCase()),
				// Message
				msg=manage
					?{
						// Message type
						type:'manage',
						// Options
						options:await api.storage.sync.get(defaultSettings),
						// Is an update because of settings changed?
						update:!noUpdate
					}
					:null;
			if(manage){
				// Copy active tab options to the message
				for(let key of optionsKeys)
					msg[key]=document.getElementById(key).checked;
				// Send the message to the active tab, if it has a http(s) URI
				website.removeAttribute('hidden');
				noWebsite.setAttribute('hidden','hidden');
				api.tabs.sendMessage(tab.id,msg);
			}else{
				// Display usage information
				website.setAttribute('hidden','hidden');
				noWebsite.removeAttribute('hidden');
			}
		},
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
		// Status update
		updateStatus=async (fromError)=>{
				// Active tab
			const tab=await currentTab();
			if(!rxHttp.test(tab.url.toLowerCase())){
				// Inactive
				setStatus('inactive',true,tab.id);
				setTimeout(updateStatus,500);
				return;
			}
			try{
				// Send the status message
				await api.tabs.sendMessage(tab.id,{type:'status'},(status)=>{
					// Set the status and start the status update timeout
					setStatus(status,true,tab.id);
					setTimeout(updateStatus,500);
				});
			}catch(ex){
				// Act as inactive
				if(!fromError) console.error('Failed to request LSC plugin status',ex,fromError);
				setStatus('inactive',!fromError,tab.id);
				setTimeout(()=>updateStatus(true),500);
			}
		},
		// Set a status
		setStatus=(status,icon,tab)=>{
			statusElement.innerText=i18n_translate(status+'Info',true);
			statusElement.className=status;
			if(icon) changeIcon('-'+status,tab);
		},
		// Plugin settings
		settings=await api.storage.sync.get(settingsKeys);
	// Pre-set options
	document.getElementById('session').checked=settings.session;
	document.getElementById('refreshDaily').checked=settings.refreshDaily;
	// Manage the active tab
	await manageTab(true);
	// Manage the active tab when options changed
	for(let id of optionsKeys)
		document.getElementById(id).addEventListener('change',manageTab);
	// Reload when the user clicked the disable button
	document.getElementById('disable').addEventListener(
		'click',
		async ()=>{
			await api.tabs.sendMessage((await api.tabs.query({active:true,currentWindow:true}))[0].id,{type:'disable'});
			close();
		}
		);
	// Clear the cache when the user clicked the "Clear cache" button
	document.getElementById('clear').addEventListener(
		'click',
		async ()=>{
			await api.tabs.sendMessage((await api.tabs.query({active:true,currentWindow:true}))[0].id,{type:'clear'});
			alert(i18n_translate('cacheCleared',true));
		}
		);
	// Close the popup when the user clicked the close button
	document.getElementById('close').addEventListener('click',()=>close());
	// Translate the page
	i18n_translate(false,false,true);
	// Get the current status
	await updateStatus();
});
