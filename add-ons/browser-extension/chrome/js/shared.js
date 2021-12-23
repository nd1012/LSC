// Browser API
const api=chrome||msBrowser||browser;

// Default settings
const defaultSettings={
	// Pre-fetch linked contents
	prefetch:true,
	// Use sessionStorage
	session:false,
	// Daily cache refresh
	refreshDaily:false
};

// Settings keys
const settingsKeys=Object.keys(defaultSettings);
