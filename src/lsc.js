// https://github.com/nd1012/LSC
if(typeof window.LSC=='undefined'){
	// LSC object
	window.LSC=async (key,version,preFetch)=>{
		// This is a singleton object!
		if(typeof window.LSC!='undefined'&&LSC.instance){
			if(typeof key!='undefined'&&key!=LSC.instance.getKey()) throw new Error('Can not change LSC cache key');
			if(version&&version>LSC.instance.getCacheVersion()){
				console.debug('Initialize newer LSC cache version',version);
				LSC.instance.clear(version);
				await LSC.instance.get(window.location.href);// Ensure the initial HTML is in the cache
			}
			return LSC.instance;
		}
		
		// Constants
			// Instance reference
		const self=LSC.instance=this,
			// Regular expression to match a link URI to manage
			rx=new RegExp('^[^\:]+\:\/\/'+document.location.hostname.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(\/.*)?$','i'),
			// Regular expression to match the file extension in an URI
			extRx=/^.+\.([^\.|\/]+)$/,
			// Regular expression to test for an URI path without a filename
			noExtRx=/\/$/;
		
		// Prepare the cache
		if(typeof key=='undefined'||key==null) key=document.location.hostname;
			// Cache
		var cache=typeof (LSC.options.useSessionStorage?sessionStorage:localStorage).getItem(key)=='string'
				?new Map(JSON.parse(localStorage.getItem(key)))
				:null,
			// History index
			historyIndex=0,
			// Session storage?
			useSessionStorage=LSC.options.useSessionStorage;
		
		// Handle a link click
		const click=async (e)=>{
			console.debug('LSC handle link click',e);
			if(!LSC.options.enable){
				console.debug('LSC disabled');
				return;
			}
			e.preventDefault();
			await self.navigate(e.target.href);
		};
		
		// Determine if an URI is excluded
		const isExcluded=(uri)=>{
			for(let ex in LSC.excluded)
				if(ex instanceof RegEx){
					if(ex.test(uri)) return true;
				}else if(uri.substring(0,ex.length)==ex){
					return true;
				}
			return false;
		};
		
		// Add click handler to managed link elements
		const manageLinks=()=>{
			if(!LSC.extensions.length) return [];// Link management was disabled
				// Current document
			const html=document.querySelector('html'),
				// Managed extensions
				extensions=LSC.extensions,
				// Managed link elements
				managed=[];
				// "beforemanage" event object
			let e;
			for(let [,a] of document.querySelectorAll(LSC.selector).entries()){
				if(
					a.href.indexOf('?')<0&&// No GET parameters
					a.href.indexOf('#')<0&&// No anchor
					rx.test(a.href)&&// URI of the current domain
					(
						noExtRx.test(a.href)||// Path without filename
						(
							extRx.test(a.href)&&// File with extension
							extensions.indexOf(a.href.replace(extRx,"$1"))>-1)// File extension is supported
						)&&
					!isExcluded(a.href)// Not excluded
					){
					console.debug('Manage link',a.href,a);
					e=new CustomEvent('beforemanage',{detail:{link:a,manage:true,preFetch:true}});
					LSC.events.dispatchEvent(e);
					if(e.detail.manage){
						// Manage
						a.addEventListener('click',click);
						a.setAttribute('data-lscmanaged',null);
						managed.push(a);
					}else{
						// Event handler denied managing
						console.debug('Event handler disabled link management',a);
					}
					// Pre-fetch the target URI's HTML
					if(
						e.detail.preFetch&&// Event handler didn't disable pre-fetching
						(!LSC.options.maxEntries||LSC.options.maxEntries>managed.length)&&// Cache limit not exceeded
						(preFetch||html.hasAttribute('data-prefetch')||a.hasAttribute('data-prefetch'))&&// Force pre-fetch
						!html.hasAttribute('data-noprefetch')&&// Pre-fetch not denied for the document
						!a.hasAttribute('data-noprefetch')// Pre-fetch not denied for the link
						){
						a.setAttribute('data-lscprefetched',null);
						self.get(a.href);
					}
				}
			}
			LSC.events.dispatchEvent(new CustomEvent('manage',{detail:{html:html,extensions:extensions,managed:managed}}));
			return managed;
		};
		
		// Get the cache
		this.getCache=()=>cache;
		
		// Get the cache key
		this.getKey=()=>key;
		
		// Get the cache version
		this.getCacheVersion=()=>cache.get('version');
		
		// Get the current history index
		this.getHistoryIndex=()=>historyIndex;
		
		// Get if using the session storage
		this.getSessionStorage=()=>seessionStorage;
		
		// Set if using the sessionStorage and store the current cache to the current store to use
		this.setSessionStorage=(activate)=>{
			if(activate==useSessionStorage) return self;
			useSessionStorage=activate;
			if(useSessionStorage&&localStorage.getItem(key)!=null) localStorage.removeItem(key);
			self.store(true);
			return self;
		};
		
		// Navigate to an URI
		this.navigate=async (uri,noState,index)=>{
			console.debug('LSC navigate to "'+uri+'"',noState,index);
				// Previous URI
			const oldUri=document.location.href,
				// Was the index parameter given?
				hasIndex=typeof index!='undefined',
				// HTML of the URI
				html=await self.get(uri);
			LSC.events.dispatchEvent(new CustomEvent('beforenavigate',{detail:{uri:uri,noState:noState,oldUri:oldUri,history:historyIndex}}));
			if(LSC.options.history){
				// Support browser history
				document.querySelector('html').innerHTML=html;
				scrollTo(0,0);
				if(!noState){
					// Add a new history entry
					if(hasIndex){
						historyIndex=index;
					}else{
						historyIndex++;
					}
					history.pushState('LSC'+historyIndex,document.title,uri);
				}else if(historyIndex||hasIndex){
					// Go back in history
					if(hasIndex){
						historyIndex=index;
					}else{
						historyIndex--;
					}
				}
			}else{
				// Create a new document
				historyIndex=0;
				document.write(html);
				document.close();
			}
			manageLinks();
			if(LSC.options.history){
				// Execute the body onload script, if exists
					// Document body
				const body=document.querySelector('body');
				if(body&&body.hasAttribute('onload'))
					(new Function('event',body.getAttribute('onload')))(new Event('load'));
			}
			LSC.events.dispatchEvent(new CustomEvent('navigated',{detail:{uri:uri,noState:noState,oldUri:oldUri,history:historyIndex}}));
			return html;
		};
		
		// Fetch an URI and update the cache
		this.update=async (uri)=>{
			console.debug('Update LSC cache for "'+uri+'"');
				// HTML of the URI
			const html=await (await fetch(uri)).text(),
				// Event data
				e=new CustomEvent('update',{detail:{uri:uri,html:html}});
			LSC.events.dispatchEvent(e);
			if(typeof e.detail.html!='string'){
				console.warn('LSC failed to fetch HTML from "'+uri+'"',e);
				LSC.events.dispatchEvent(new CustomEvent('error',{detail:{uri:uri,html:e.detail.html}}));
				debugger;
				return cache.get(uri);
			}
			cache.set(uri,e.detail.html);
			if(LSC.options.maxEntries&&cache.size>LSC.options.maxEntries+1){
				// Unshift the cached entries to fit the max. number of cached entries
				let keys=cache.keys();
				keys.next();// Skip the version number key, which is the first key always!
				cache.remove(keys.next().value);
			}
			LSC.events.dispatchEvent(new CustomEvent('updated',{detail:{uri:uri,html:e.detail.html}}));
			return e.detail.html;
		}
		
		// Get an URI from the cache or fetch the URI and update the cache
		this.get=async (uri)=>cache.has(uri)?cache.get(uri):await self.update(uri);
		
		// Clear the cache
		this.clear=(version)=>{
			if(!LSC.options.quiet) console.trace('Clear LSC cache',version);
			if(cache){
				cache.clear();
			}else{
				cache=new Map();
			}
			cache.set('version',version?+version:Math.floor(Date.now()/1000));
			LSC.events.dispatchEvent(new CustomEvent('clear',{detail:{cache:cache,version:version}}));
			return self.store(true);
		}
		
		// Store the cache
		this.store=(notClear)=>{
			try{
				if(!LSC.options.quiet) console.trace('Store LSC cache',notClear);
				LSC.events.dispatchEvent(new CustomEvent('store',{detail:{cache:cache}}));
				(useSessionStorage?sessionStorage:localStorage).setItem(key,JSON.stringify(Array.from(cache.entries())));
			}catch(e){
				if(notClear){
					// Avoid stack overflow by endless recursion
					console.error('Failed to store the LSC cache',e);
					debugger;
				}else{
					// Clear on error
					console.error('Failed to store the LSC cache - initializing',e);
					self.clear(cache.get('version'));
				}
			}
			return cache;
		};
	
		// Construction code
		if(!LSC.options.quiet) console.log('LSC initializing',key,version,preFetch);
		if(!cache||(version&&cache.get('version')<+version)) this.clear(version);
		document.body.addEventListener('beforeunload',this.store);
		history.replaceState('LSC0',document.title,document.location.href);// Required to manage the history entry of the initial page
		await this.get(document.location.href);// Ensure the initial HTML is in the cache
		window.addEventListener('popstate',async (e)=>{
			// Handle browser history navigation
			if(!LSC.options.history) return;
				// New URI
			const uri=window.location.href,
				// New history index
				index=parseInt(e.state.substring(3)),
				// Went back?
				back=index<historyIndex;
			console.debug('LSC history (#'+index+') navigation '+(back?'back':'forward')+' to "'+uri+'"',e);
			e.preventDefault();
			await self.navigate(uri,true,index);
			setTimeout(()=>LSC.events.dispatchEvent(new CustomEvent('history',{detail:{uri:uri,index:index,back:back}})),0);
		});
		manageLinks();
		LSC.events.dispatchEvent(new Event('load'));
		return this;
	};
	
	// Singleton instance
	LSC.instance=null;
	
	// LSC events
	LSC.events=new EventTarget();
	
	// Managed link selector
	LSC.selector='a:not([target]):not([onclick]):not([data-lscunmanaged]),a[data-lscmanaged]';
	
	// Supported URI extensions
	LSC.extensions=['html','htm','php'];
	
	// Excluded URIs or regular expressions
	LSC.exclude=[];

	// LSC options	
	LSC.options={
		// If false, LSC will stop handling managed link clicks, and the browser will continue with the normal behavior
		enable:true,
		// If true, nothing will be logged to the console (except warnings, errors and debug information (if you set the debug level to do so))
		quiet:false,
		// If false, browser history won't be supported, but instead DOM events would be raised as usual again
		history:true,
		// If true, the sessionStorage will be used instead of the localStorage
		useSessionStorage:false,
		// Maximum number of cached entries and managed pre-fetched links per page (zero for unlimited)
		maxEntries:0
	};
}
