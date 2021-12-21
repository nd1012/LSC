// https://github.com/nd1012/LSC
if(typeof window.LSC=='undefined'){
	// LSC object
	window.LSC=async (key,version,preFetch)=>{
			// Instance
		const self=LSC.instance?LSC.instance:this;
		
		// This is a singleton object!
		if(LSC.instance){
			// Deny cache key update
			if(typeof key!='undefined'&&key!=self.getKey()) throw new Error('Can not change LSC cache key');
			// Handle a new cache version
			if(version&&version>self.getCacheVersion()){
				console.debug('Initialize newer LSC cache version',version);
				instance.clear(version);
				await self.get(window.location.href);// Ensure the initial HTML is in the cache
			}
			// Return the running instance instead of THIS
			return self;
		}
		LSC.instance=this;
		
		// Constants
			// Regular expression to match a link URI to manage
		const rx=new RegExp('^[^\:]+\:\/\/'+document.location.hostname.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(\/.*)?$','i'),
			// Regular expression to match the file extension from an URI
			extRx=/^.+([^\/]+|\.([^\.|\/]+))$/;
		
		// Prepare the cache
		if(typeof key=='undefined'||key==null) key=document.location.hostname;
			// Cache
		var cache=typeof (LSC.options.useSessionStorage?sessionStorage:localStorage).getItem(key)=='string'
				?new Map(JSON.parse((LSC.options.useSessionStorage?sessionStorage:localStorage).getItem(key)))
				:null,
			// History index
			historyIndex=0,
			// Session storage?
			useSessionStorage=LSC.options.useSessionStorage,
			// Concurrent fetch-actions
			fetching=new Map();
		
		// Handle a link click
		const click=async (e)=>{
			console.debug('LSC handle link click',e);
			if(!LSC.options.enable){
				console.debug('LSC disabled');
				return;
			}
			e.preventDefault();
			if(await self.navigate(e.target.href)) return;
			// Redirect, if LSC navigation failed
			console.warn('LSC failed to navigate',e);
			if(LSC.debugOnError) debugger;
			document.location.href=e.target.href;
		};
		
		// Handle browser reload by user (Ctrl+R)
		const reload=async (e)=>{
			if(!e.ctrlKey||e.shiftKey||e.altKey||e.key!='R') return;
			await self.clear(self.getCacheVersion());
			debugger;
		};
		
		// Determine if an URI is excluded
		const isExcluded=(uri)=>{
			if(!LSC.exclude.length) return false;
			for(let ex in LSC.exclude)
				if(ex instanceof RegEx){
					if(ex.test(uri)) return true;
				}else if(uri.substring(0,ex.length)==ex){
					return true;
				}
			return false;
		};
		
		// Determine if an URI is included (can override an exclude)
		const isIncluded=(uri)=>{
			if(!LSC.include.length) return false;
			for(let ex in LSC.include)
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
				managed=[],
				// Now
				now=Date.now();
				// "beforemanage" event object
			let e;
			for(let [,a] of document.querySelectorAll(LSC.selector).entries())
				if(
					isIncluded(a.href)||// Forced to include
					(
						a.href.indexOf('?')<0&&// No GET parameters
						a.href.indexOf('#')<0&&// No anchor
						rx.test(a.href)&&// URI of the current domain
						(
							!extRx.test(a.href)||// Path without filename
							extensions.indexOf(a.href.replace(extRx,"$2"))>-1// File extension is supported
						)&&
						!isExcluded(a.href)// Not excluded
					)
					){
					console.debug('Manage link',a.href,a);
					e=new CustomEvent('beforemanage',{detail:{link:a,manage:true,preFetch:true}});
					LSC.events.dispatchEvent(e);
					if(e.detail.manage){
						// Manage
						a.addEventListener('click',click);
						a.setAttribute('data-lscmanaged',now);
						managed.push(a);
					}else{
						// Event handler denied managing
						console.debug('Event handler disabled LSC link management',a);
					}
					// Pre-fetch the target URI's HTML
					if(!e.detail.preFetch){
						console.debug('Event handler disabled LSC pre-fetching',a);
					}else if(
						(!LSC.options.maxEntries||LSC.options.maxEntries>managed.length)&&// Cache limit not exceeded
						(preFetch||html.hasAttribute('data-prefetch')||a.hasAttribute('data-prefetch'))&&// Force pre-fetch
						!html.hasAttribute('data-noprefetch')&&// Pre-fetch not denied for the document
						!a.hasAttribute('data-noprefetch')// Pre-fetch not denied for the link
						){
						a.setAttribute('data-lscprefetched',now);
						self.get(a.href).then((res)=>{
							if(typeof res!='string')
								a.setAttribute('data-lscprefetched',a.getAttribute('data-lscprefetched')+' (failed)');
						});
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
		
		// Get if pre-fetching
		this.getPreFetch=()=>preFetch;
		
		// Get the current history index
		this.getHistoryIndex=()=>historyIndex;
		
		// Get the number of fetch actions
		this.getFetchCount=()=>fetching.size;
		
		// Get if using the session storage
		this.getSessionStorage=()=>useSessionStorage;
		
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
				html=await self.get(uri,true);
			if(html==null){
				// Raise a warning, if the requested HTML is missing
				console.warn('LSC got no HTML for URI "'+uri+'"',noState,index,oldUri);
				return false;
			}
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
				document.addEventListener('keydown',reload);
			}
			manageLinks();
			if(LSC.options.history){
				// Execute the body onload script, if exists
					// Document body
				const body=document.querySelector('body');
				if(body&&body.hasAttribute('onload'))
					new Function('event',body.getAttribute('onload'))(new Event('load'));
			}
			LSC.events.dispatchEvent(new CustomEvent('navigated',{detail:{uri:uri,noState:noState,oldUri:oldUri,history:historyIndex}}));
			return true;
		};
		
		// Fetch an URI and update the cache
		this.update=async (uri,priority,ignoreMime)=>{
			console.debug('Update LSC cache for "'+uri+'"',priority,ignoreMime);
			// Avoid double-fetching
			if(!priority&&fetching.has(uri)){
				console.debug('LSC avoid double-fetching "'+uri+'"');
				await fetching.get(uri);
				return cache.get(uri);
			}
			// Avoid too many concurrent fetch-actions
				// If we had to pause because of too many concurrent fetch-actions
			var paused=false;
			if(!priority&&fetching.size>=LSC.options.maxConcurrentFetch){
				console.debug('Waiting for running concurrent LSC fetch-actions to finish ('+fetching.size+')',fetching);
				for(paused=true;fetching.size>=LSC.options.maxConcurrentFetch;await fetching.entries().next().value[1]);
				console.debug('Continue updating LSC cache for "'+uri+'"');
			}
				// Fetch-task resolve method
			var resolve=null;
			if(!priority) fetching.set(uri,new Promise((rm)=>resolve=rm));
			// Fetch the HTML of the requested URI
			try{
					// Response
				const res=await fetch(uri),
					// Response raw content type
					rawCt=res.headers.get('Content-Type').trim(),
					// Response MIME type
					ct=rawCt.toLowerCase(),
					// Is the response MIME type ok (HTML and XHTML are allowed)?
					valid=ct.substring(0,9)=='text/html'||ct.substring(0,21)=='application/xhtml+xml';
					// HTML of the URI
					html=await res.text(),
					// Event data
					e=new CustomEvent('update',{detail:{uri:uri,html:html,response:res,priority:!!priority,ignoreMime:!!ignoreMime}});
				if(!valid&&!ignoreMime){
					// Raise a warning on invalid response MIME type
					console.warn('LSC received an invalid response MIME type for "'+uri+'"',uri,ct,res,e);
					if(LSC.debugOnError) debugger;
					let ed=new CustomEvent(
						'invalid',
						{detail:{uri:uri,html:html,contentType:rawCt,response:res,cancel:false,priority:!!priority,ignoreMime:!!ignoreMime}}
						);
					LSC.events.dispatchEvent(ed);
					if(ed.detail.cancel){
						// Return the old cache content
						console.debug('Invalid MIME type response handling from "'+uri+'" has been disabled by LSC event handler',ed);
						return cache.get(uri);
					}
				}
				LSC.events.dispatchEvent(e);
				if(typeof e.detail.html!='string'){
					// Raise a warning on invalid HTML and return the old cache content
					console.warn('LSC failed to fetch HTML from "'+uri+'"',e);
					if(LSC.debugOnError) debugger;
					LSC.events.dispatchEvent(new CustomEvent('error',{detail:{uri:uri,html:e.detail.html}}));
					return cache.get(uri);
				}
				cache.set(uri,e.detail.html);
				if(LSC.options.maxEntries&&cache.size>LSC.options.maxEntries+1){
					// Unshift the cached entries to fit the max. number of cached entries
					let keys=cache.keys();
					keys.next();// Skip the version number key, which is the first key always!
					cache.delete(keys.next().value);
				}
				LSC.events.dispatchEvent(new CustomEvent(
					'updated',
					{detail:{uri:uri,html:e.detail.html,priority:!!priority,ignoreMime:!!ignoreMime}}
					));
				return e.detail.html;
			}catch(ex){
				console.error('Error updating LSC cache for "'+uri+'"',ex);
				if(LSC.debugOnError) debugger;
				return cache.get(uri);
			}finally{
				if(!priority){
					// Ensure the fetch-task is completed before returning
					resolve();
					fetching.delete(uri);
					if(paused) console.debug('Finished updating LSC cache for "'+uri+'"');
				}
			}
		}
		
		// Get an URI from the cache or fetch the URI and update the cache
		this.get=async (uri,priority,ignoreMime)=>cache.has(uri)?cache.get(uri):await self.update(uri,priority,ignoreMime);
		
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
					if(LSC.debugOnError) debugger;
				}else{
					// Clear on error
					console.error('Failed to store the LSC cache - initializing',e);
					self.clear(cache.get('version'));
				}
			}
			return cache;
		};
	
		// Construction code
		if(!LSC.options.quiet) console.log('LSC initializing',LSC.VERSION,key,version,preFetch,LSC.options.isPlugin);
		if(!cache||(version&&cache.get('version')<+version)) this.clear(version);// Ensure a valid cache (clear, if the site version increased)
		document.body.addEventListener('beforeunload',this.store);// Store the cache when leaving this site
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
			if(!await self.navigate(uri,true,index)){
				// Relocate on error
				console.warn('LSC failed to navigate to "'+uri+'" - fallback to real browser relocation',e);
				if(LSC.debugOnError) debugger;
				document.location.href=uri;
				return;
			}
			setTimeout(()=>LSC.events.dispatchEvent(new CustomEvent('history',{detail:{uri:uri,index:index,back:back}})),0);
		});
		manageLinks();// Start managing links on the initial page
		document.addEventListener('keydown',reload);// Handle page reload
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
	
	// Included URIs or regular expressions
	LSC.include=[];

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
		maxEntries:0,
		// Maximum number of concurrent fetch-actions
		maxConcurrentFetch:5,
		// Debug on error?
		debugOnError:true,
		// Is running from the browser plugin?
		isPlugin:false
	};
	
	// LSC version
	LSC.VERSION=3;// Please don't change the value!
}
