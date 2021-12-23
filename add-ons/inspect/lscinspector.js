// Inspect a website for possible problems when running LSC
window.LSCInspector={};
LSCInspector.run=async ()=>{
	// Ensure the function to get the event listeners exists (should exist in the JavaScript console)
	if(typeof window.getEventListeners!='function'){
		console.error('Function getEventListeners not found');
		return false;
	}
	// Ensure no LSC global was defined
	if(typeof window.LSC!='undefined') console.warn('ERROR: LSC global defined already (ensure it is LSC itself, otherwise LSC will not run)',LSC);
	// Check window event listeners
	let temp=getEventListeners(window),
		res=true;
	if(typeof temp['load']!='undefined'){
		console.warn('POSSIBLE PROBLEM: "load" event handlers in window',temp);
		res=false;
	}
	if(typeof temp['DOMContentLoaded']!='undefined'){
		console.warn('POSSIBLE PROBLEM: "DOMContentLoaded" event handlers in window',temp);
		res=false;
	}
	if(typeof temp['readystatechanged']!='undefined'){
		console.warn('POSSIBLE PROBLEM: "readystatechanged" event handlers in window',temp);
		res=false;
	}
	if(typeof temp['popstate']!='undefined'){
		console.warn('POSSIBLE PROBLEM: "popstate" event handlers in window',temp);
		res=false;
	}
	// Check document event listeners
	temp=getEventListeners(document);
	if(typeof temp['load']!='undefined'){
		console.warn('POSSIBLE PROBLEM: "load" event handlers in document',temp);
		res=false;
	}
	if(typeof temp['DOMContentLoaded']!='undefined'){
		console.warn('POSSIBLE PROBLEM: "DOMContentLoaded" event handlers in document',temp);
		res=false;
	}
	if(typeof temp['readystatechanged']!='undefined'){
		console.warn('POSSIBLE PROBLEM: "readystatechanged" event handlers in document',temp);
		res=false;
	}
	// Check body onload handler
	temp=document.querySelector('body');
	if(!temp){
		console.warn('POSSIBLE PROBLEM: No "body" HTML element');
		res=false;
	}else{
		if(body.hasAttribute('onload')) console.log('OK: "body" has an "onload" event handler',temp);
	}
	// Find manageable links
	temp=document.querySelectorAll('a:not([target]):not([onclick]):not([data-lscunmanaged]),a[data-lscmanaged]').length;
	let temp2=document.querySelectorAll('a').length;
	if(temp<temp2/2) console.warn('Less than 50% ('+temp+' of '+temp2+') of all links may be LSC manageable');
	// Check LSC
	if(LSC){
		// Ensure an instance
		let test=true,
			version=LSC.VERSION();
		if(version<3){
			console.error('ERROR: Unsupported LSC version #'+LSC.VERSION());
			res=false;
			test=false;
		}
		if(test&&!LSC.instance){
			try{
				await LSC();
				if(!LSC.instance) throw new Error('No LSC instance');
			}catch(ex){
				console.error('ERROR: Failed to run LSC: '+ex.getMessage(),ex);
				res=false;
				test=false;
			}
		}
		// Run tests
		if(test){
			// Count managed links
			temp=document.querySelectorAll('a[data-lscmanaged]').length;
			if(temp<temp2/2) console.warn('Less than 50% ('+temp+' of '+temp2+') of all links are managed');
			// Count extensions
			if(!LSC.extensions.length) console.warn('No managed extensions');
			// Count MIME types
			if(!LSC.mimeTypes.length) console.warn('No supported content MIME types');
			// Test cache
			if(!LSC.instance.getCache().has(location.href)) console.warn('Current LSC instance did not cache the current page');
		}
	}
	// Check browser capabilities
	if(!localStorage){
		console.log('POSSIBLE PROBLEM: No local storage');
		res=false;
	}
	if(!sessionStorage){
		console.log('POSSIBLE PROBLEM: No session storage');
		res=false;
	}
	//TODO To be extended...
	// Output summary
	if(res){
		console.log(location.href+' may be good for running with LSC');
	}else{
		console.warn(location.href+' has possible problems or errors that may make it difficult or impossible to run LSC and having a good experience');
	}
	return res;
};
