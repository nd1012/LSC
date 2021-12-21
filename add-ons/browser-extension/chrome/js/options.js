// Load extension options from the storage
async function loadSettings(){
		// Options or default settings
	const settings=Object.assign({},defaultSettings,await api.storage.sync.get(settingsKeys));
	console.log(settings);
	// Check chosen options
	for(let [id,] of Object.entries(settings).filter((i)=>i[1]))
		document.getElementById(id).setAttribute('checked','checked');
	return settings;
}

// Save extension options to the storage
async function storeSettings(){
		// Settings
	const settings={};
	// Get the options states
	for(let [id,] of Object.entries(settingsKeys).filter((i)=>i[1]))
		settings[id]=document.getElementById(id).checked;
	// Store the settings
	await api.storage.sync.set(settings);
	return settings;
}

// Add event listeners
window.addEventListener('load',async ()=>{
	// Ensure options have been loaded
	await loadSettings();
	// Store options as soon as an option has been changed
	for(let id of settingsKeys)
		document.getElementById(id).addEventListener('change',async ()=>await storeSettings());
});
