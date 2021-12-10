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
			extRx=/^.+\.([^\.|\/]+)$/;
		
		// Prepare the cache
		if(typeof key=='undefined'||key==null) key=document.location.hostname;
			// Cache
		var cache=typeof localStorage.getItem(key)=='string'?new Map(JSON.parse(localStorage.getItem(key))):null,
			// History index
			historyIndex=0;
		
		// Handle a link click
		const click=(e)=>{
			console.debug('LSC handle link click',e);
			e.preventDefault();
			self.navigate(e.target.href);
		};
		
		// Add click handler to managed link elements
		const manageLinks=()=>{
				// Current document
			const html=document.querySelector('html'),
				// Managed extensions
				extensions=LSC.extensions,
				// Managed link elements
				managed=[];
			for(let [,a] of document.querySelectorAll('a:not([target])').entries()){
				if(
					a.href.indexOf('?')<0&&// No GET parameters
					a.href.indexOf('#')<0&&// No anchor
					rx.test(a.href)&&// URI of the current domain
					extRx.test(a.href)&&// Has an extension
					extensions.indexOf(a.href.replace(extRx,"$1"))>-1// Extension is supported
					){
					a.addEventListener('click',click);
					managed.push(a);
					// Pre-fetch the target URI's HTML
					if(
						(preFetch||html.hasAttribute('data-prefetch')||a.hasAttribute('data-prefetch'))&&// Force pre-fetch
						!html.hasAttribute('data-noprefetch')&&// Pre-fetch not denied for the document
						!a.hasAttribute('data-noprefetch')// Pre-fetch not denied for the link
						)
						self.get(a.href);
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
			document.querySelector('html').innerHTML=html;
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
			manageLinks();
				// Document body
			const body=document.querySelector('body');
			if(body&&body.hasAttribute('onload'))
				// Execute the body onload script
				(new Function('event',body.getAttribute('onload')))(new Event('load'));
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
				debugger;
			}
			cache.set(uri,e.detail.html);
			return e.detail.html;
		}
		
		// Get an URI from the cache or fetch the URI and update the cache
		this.get=async (uri)=>cache.has(uri)?cache.get(uri):await self.update(uri);
		
		// Clear the cache
		this.clear=(version)=>{
			console.trace('Clear LSC cache',version);
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
				console.trace('Store LSC cache',notClear);
				LSC.events.dispatchEvent(new CustomEvent('store',{detail:{cache:cache}}));
				localStorage.setItem(key,JSON.stringify(Array.from(cache.entries())));
			}catch(e){
				if(notClear){
					// Avoid endless recursion
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
		console.log('LSC initializing',key,version,preFetch);
		if(!cache||(version&&cache.get('version')<+version)) this.clear(version);
		document.body.addEventListener('beforeunload',this.store);
		history.replaceState('LSC0',document.title,document.location.href);// Required to manage the history entry of the initial page
		await this.get(document.location.href);// Ensure the initial HTML is in the cache
		window.addEventListener('popstate',async (e)=>{
			// Handle browser history navigation
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
	
	// Supported URI extensions
	LSC.extensions=['html','htm','php'];
}
