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
		rxHttp=/^https?\:\/\//,
		// Manage the active tab
		manageTab=async (tab)=>{
				// Manage the active tab?
			const manage=rxHttp.test(tab.url.toLowerCase()),
				// Message
				msg=manage?{
					// Message type
					type:'manage',
					// Options
					options:await api.storage.sync.get(defaultSettings)
				}:null;
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
		// Status update
		updateStatus=async ()=>{
				// Active tab
			const tab=(await api.tabs.query({active:true,currentWindow:true}))[0],
				// Manage the active tab?
				manage=tab&&rxHttp.test(tab.url.toLowerCase());
			if(!manage){
				// Inactive
				statusElement.innerText='inactive';
				statusElement.className='inactive';
				setTimeout(updateStatus,500);
				return;
			}
			try{
				// Send the status message
				await api.tabs.sendMessage(tab.id,{type:'status'},(status)=>{
					// Set the status and start the status update timeout 
					statusElement.innerText=status;
					statusElement.className=status;
					setTimeout(updateStatus,500);
				});
			}catch(ex){
				// Act as inactive and stop status updates on error
				console.error('Failed to request LSC plugin status',ex);
				statusElement.innerText='inactive';
				statusElement.className='inactive';
			}
		};
	// Pre-set options
	document.getElementById('session').checked=await api.storage.sync.get({session:defaultSettings.session}).session;
	// Manage the active tab
	await manageTab((await api.tabs.query({active:true,currentWindow:true}))[0]);
	// Manage the active tab when options changed
	for(let id of optionsKeys)
		document.getElementById(id).addEventListener(
			'change',
			async ()=>await manageTab((await api.tabs.query({active:true,currentWindow:true}))[0])
			);
	// Close the popup when the user clicked the close button
	document.getElementById('close').addEventListener('click',()=>close());
	// Get the current status
	await updateStatus();
});
