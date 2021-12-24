// Load extension options from the storage
async function loadSettings(){
	console.debug('Load LSC plugin settings');
		// Options or default settings
	const settings=Object.assign({},defaultSettings,await api.storage.sync.get(settingsKeys));
	// Check chosen options
	for(let [id,] of Object.entries(settings).filter((i)=>i[1]))
		document.getElementById(id).setAttribute('checked','checked');
	console.debug('LSC plugin settings',settings);
	return settings;
}

// Save extension options to the storage
async function storeSettings(){
	console.debug('Store LSC plugin settings');
		// Settings
	const settings={};
	// Get the options states
	for(let [id,] of Object.entries(settingsKeys).filter((i)=>i[1]))
		settings[id]=document.getElementById(id).checked;
	// Store the settings
	console.debug('LSC plugin settings',settings);
	await api.storage.sync.set(settings);
	return settings;
}

// Add event listeners
window.addEventListener('load',async ()=>{
	console.log('Initialize LSC plugin options');
	// Ensure options have been loaded
	await loadSettings();
	// Store options as soon as an option has been changed
	for(let id of settingsKeys)
		document.getElementById(id).addEventListener('change',async ()=>await storeSettings());
	// Translate the page
	i18n_translate(false,false,true);
	console.debug('LSC plugin options initialized');
});
