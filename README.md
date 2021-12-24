# LSC - JavaScript `localStorage` Cache

This handy JavaScript will cache the HTML of URIs that have been fetched from your domain in the `localStorage` of the browser and use that cached HTML next time that URIs are requested from a link. This can make many multipage websites appear super fast, like it's a single-page-app (which will become almost true with LSC) :)

**NOTE**: Because LSC uses heavy caching, less or more requests will be sent to your webserver, which can affect the statistics from the webserver's logfile.

## Table of contents

- [Usage](#usage)
	- [Try it first!](#try-it-first)
	- [Pre-fetching](#pre-fetching)
		- [Ethnical use](#ethnical-use)
	- [JavaScript console actions](#javascript-console-actions)
		- [Clear the current LSC cache](#clear-the-current-lsc-cache)
		- [Store the current LSC cache to the `localStorage`](#store-the-current-lsc-cache-to-the-localstorage)
		- [Navigate to an URI (that will be cached or loaded from the LSC cache)](#navigate-to-an-uri-that-will-be-cached-or-loaded-from-the-lsc-cache)
		- [Get cached HTML, or request HTML from the server and update the LSC cache](#get-cached-html-or-request-html-from-the-server-and-update-the-lsc-cache)
		- [Request HTML from the server and update the LSC cache](#request-html-from-the-server-and-update-the-lsc-cache)
		- [Get the current LSC cache](#get-the-current-lsc-cache)
		- [Get the current LSC cache key](#get-the-current-lsc-cache-key)
		- [Get the current LSC cache version](#get-the-current-lsc-cache-version)
		- [Get the current LSC navigation history index](#get-the-current-lsc-navigation-history-index)
		- [Determine if the LSC instance is pre-fetching](#determine-if-the-lsc-instance-is-pre-fetching)
		- [Initialize the LSC cache with a new version after initialized during runtime](#initialize-the-lsc-cache-with-a-new-version-after-initialized-during-runtime)
		- [Get if using the session storage](#get-if-using-the-session-storage)
		- [Set if using the session storage](#set-if-using-the-session-storage)
		- [Be quiet](#be-quiet)
		- [Temporary disable](#temporary-disable)
		- [Change managed link selector](#change-managed-link-selector)
		- [Exclude link URIs](#exclude-link-uris)
		- [Limit the number of cached entries](#limit-the-number-of-cached-entries)
		- [Limit the number of concurrent fetch-actions](#limit-the-number-of-concurrent-fetch-actions)
	- [Events](#events)
- [Automatic renewal of browser caches](#automatic-renewal-of-browser-caches)
- [Issues with the browser cache](#issues-with-the-browser-cache)
- [Issues with the `localStorage` available space](#issues-with-the-localstorage-available-space)
- [Known issues/limitations](#known-issueslimitations)
- [Use `sessionStorage` instead of `localStorage`](#use-sessionstorage-instead-of-localstorage)
- [Extended usage for caching any key/value pairs](#extended-usage-for-caching-any-keyvalue-pairs)
- [Good to know](#good-to-know)
- [Add-ons](#add-ons)
- [Roadmap](#roadmap)

## Usage

```html
<!DOCTYPE html>

<html>

	<head>
	
		<!-- Load the LSC JavaScript from your websites JS location -->
		<script src="lsc.min.js"></script>
		<!-- ...or from a CDN service -->
		<!-- <script src="https://cdn.jsdelivr.net/gh/nd1012/LSC/src/lsc.min.js"></script> -->
		
		<!-- Configure and run LSC -->
		<script>
		
		// Per default html, htm and php are supported - add more extensions to handle here
		LSC.extensions.push('md');// Enable the MarkDown file extension
		
		// Run LSC in the window load event
		window.addEventListener('load',async ()=>await LSC('cacheName',1,true));
		
		</script>
		
	</head>
	
	<body>
	
		<!-- External links won't be managed -->
		<a href="https://google.com">This link to Google won't be managed</a>
		
		<!-- Links with a target won't be managed, even if they're internal -->
		<a href="anyPage.html" target="_blank">This internal link to a target won't be managed</a>
		
		<!-- Example of a managed, internal link -->
		<a href="anotherPage.html">This internal link will be managed</a>
		
		<!-- Example of a managed, internal, but not pre-fetched link (content will be loaded on demand) -->
		<a href="justAnotherPage.html" data-noprefetch>This internal link won't be pre-fetched</a>
		
	</body>

</html>
```

The `LSC` method gets 3 parameters:

1. (optional) A unique name of the cache (will be used as `localStorage` key) (default: current domain)
2. (optional) The current page version number (increase the version number, if you want all browser caches to update) (default: current Unix timestamp)
3. (optional) If URIs from links on the page to your domain should be pre-fetched (default: `false`)

On page load LSC will dispatch the `navigate` event on the `LSC.events` object.

LSC handles the click event of links (`A` tags without `target` attribute) that

- call the current domain
- don't contain GET parameters
- don't contain an anchor
- end with a supported file extension

Per default the extensions `html`, `htm` and `php` are supported. Add more extensions to the `LSC.extensions` list, if required.

To force managing a link, that actually wouldn't be managed from that selection, you can add the attribute `data-lscmanaged` in your HTML code. To avoid LSC managing a link, add the attribute `data-lscunmanaged`.

If a managed link was clicked, the browser address bar will update, and even the browser history will get a new entry and supports the back-button as usual. The only difference is: If the link target was cached already, no http request will be sent, but the cached HTML will be used instead.

Find an online demonstration [here](https://nd1012.github.io/LSC/index.html).

**NOTE**: If you defined an event handler in the `body` html tag's `onload` attribute, on each navigation the handler will be executed, but the `load` event won't fire as usual - which means: If you used `addEventListener` to attach to the `load` event etc., they won't be called. Attach to the `navigate` event on the `LSC.events` object instead. Other events (like `beforeunload`, `unload`, `DOMContentLoaded`, `readystatechanged` etc.) will be omitted. For `unload` you can attach to the `beforenavigate` event in the `LSC.events` object.

### Try it first!

Before you start to include LSC into your website, please make sure that it works, and identify possible problems. To do that you can simply use your browsers developer tools (the JavaScript console) by pressing `F12` or `Shift+Ctrl+I` and entering these JavaScript commands after you browsed to your website:

```js
// Load LSC
var script=document.createElement('script');
script.src='https://cdn.jsdelivr.net/gh/nd1012/LSC/src/lsc.js';
document.querySelector('head').appendChild(script);
// Wait for the resource to be loaded (watch the "Network" tab)

// Do any LSC configuration that you want to do here

// Run LSC
LSC('test',1,true).then(()=>alert('LSC is ready!'));
```

Or - for a maybe more fast and easy try, have a look at the [browser extension](add-ons/browser-extension/). The browser extension will attach LSC to any website running in the current browser tab and use the factory default settings for the LSC instance. That's easy, but you won't be able to adjust any settings when using the browser extension. Using the developer tools aproach will give you more control over what's happening.

### Pre-fetching

The pre-fetching of URIs from the current page will be done in the background and shouldn't disturb the user. If pre-fetching is disabled, HTML will be loaded on demand. For each page, even for each link you can decide, if you want pre-fetch the URI(s) or not.

To disable pre-fetching for a document, add the `data-noprefetch` attribute to the `html` tag:

```html
...
<html data-noprefetch>
...
```

To disable pre-fetching for a single link, add the `data-noprefetch` attribute to the `a` tag:

```html
...
<a href="..." data-noprefetch>...</a>
...
```

To enable pre-fetching for the document or a single link, add the `data-prefetch` attribute to the tag.

#### Ethnical use

Blind pre-fetching of all linked contents of a website leads to a huge traffic overload, which you may ignore, if it's not your own server that has to deliver the response. Please be sure to pre-fetch only contents which are very likely to be requested from an user. You could use a predicting engine f.e. to see which links the user may target with his mouse actions.

### JavaScript console actions

#### Clear the current LSC cache

```js
LSC.instance.clear(LSC.instance.getCacheVersion());
```

#### Store the current LSC cache to the `localStorage`

```js
LSC.instance.store();
```

#### Navigate to an URI (that will be cached or loaded from the LSC cache)

```js
LSC.instance.navigate('https://...');
```

#### Get cached HTML, or request HTML from the server and update the LSC cache

```js
var html=await LSC.instance.get('https://...');
```

**NOTE**: This works for any URI with any file extension and even GET parameters and anchors!

#### Request HTML from the server and update the LSC cache

```js
var html=await LSC.instance.update('https://...');
```

**NOTE**: This works for any URI with any file extension and even GET parameters and anchors!

#### Get the current LSC cache

```js
console.log(LSC.instance.getCache());
```

#### Get the current LSC cache key

```js
console.log(LSC.instance.getKey());
```

#### Get the current LSC cache version

```js
console.log(LSC.instance.getCacheVersion());
```

#### Get the current LSC navigation history index

```js
console.log(LSC.instance.getHistoryIndex());
```

#### Determine if the LSC instance is pre-fetching

```js
if(LSC.instance.getPreFetch())
	console.log(LSC.instance.getFetchCount());
```

If the LSC instance uses pre-fetching, the `getFetchCount` method will return the current pre-fetch stack size (without the fetching actions that are waiting in the background for the stack to free a slot).

#### Initialize the LSC cache with a new version after initialized during runtime

```js
LSC(LSC.instance.getKey(),2);
```

**NOTE**: The key needs to be the current cache name, and the version needs to be decreased (increasing has no effect). The pre-fetching behavior can't be changed from the initial state.

#### Get if using the session storage

```js
console.log(LSC.instance.getSessionStorage());
```

#### Set if using the session storage

```js
LSC.instance.setSessionStorage(true);// Use sessionStorage instead of localStorage
```

This will store the current cache to the current storage to use. If you switch to the `sessionStorage`, the cache would be deleted from the `localStorage`.

#### Be quiet

```js
LSC.options.quiet=true;
```

In quiet mode, LSC will only write errors, warnings and debug information to the JavaScript console.

#### Temporary disable

```js
LSC.options.enable=false;
```

While disabled, LSC won't handle managed link clicks.

#### Change managed link selector

```js
LSC.selector='...';
```

This will set a new CSS selector for selecting links to manage from the current document.

#### Exclude link URIs

```js
LSC.exclude.push('https://uri.to/excluded/content/');// Exclude a path and its contents recursive
LSC.exclude.push(/\/cache\//);// Exclude "cache"-path and its contents recursive by regular expression
```

**NOTE**: An exclude can be overridden from an include!

#### Include link URIs

```js
LSC.exclude.push('https://uri.to/included/content/');// Include a path and its contents recursive
LSC.exclude.push(/\/important\//);// Include "cache"-path and its contents recursive by regular expression
```

**NOTE**: An include would override an exclude!

#### Limit the number of cached entries

```js
LSC.options.maxEntries=100;
```

This limit will affect the max. number of pre-fetched managed links per page, and the max. number of cached entries. If the cache is full, and a new URI is going to be fetched, the oldest entry will be deleted from the cache to fit the limitation.

#### Limit the number of concurrent fetch-actions

To avoid self-DoS your own server, the number of concurrent fetch-actions should be limited (to a maximum of `5` by default). To change this value:

```js
LSC.options.maxConcurrentFetch=10;
```

An users navigation action has priority and would ignore this limit (otherwise the user navigation would block until some fetch-actions finished!).

### Events

The `LSC.events` object can raise these events:

- `beforemanage`: It's possible to hook and decide if a link should be managed (and pre-fetched) or not
- `manage`: Attached to links in the HTML document to manage clicks (will provide a list of all managed link elements)
- `beforenavigate`: Before navigating to a new URI (can't be cancelled)
- `navigated`: After navigated to a new URI
- `update`: After fetched HTML for an URI (and before storing it in the cache - the `html` in the event object may be manipulated)
- `updated`: After a fetched HTML has been written to the cache
- `clear`: After cleared/initialized the cache map
- `store`: Before storing the cache to the `localStorage` (you may modify the cache before writing to the storage)
- `history`: After navigated in the browser history
- `load`: LSC initialized (raised only once for the singleton instance)
- `error`: Failed to fetch an URI
- `invalid`: The fetched response has an invalid MIME type (`text/html` (HTML) and `application/xhtml+xml`(XHTML) are allowed)

## Automatic renewal of browser caches

You could force an automatic renewal of the LSC cache, if you use an automatic version when initializing LSC. For example, you could use the Unix timestamp of the current day as version number to ensure that tomorrow all browsers will reload HTML contents from your webserver - example:

```js
window.addEventListener('load',async ()=>{
	let now=new Date();
	await LSC('cacheName',(new Date(now.getFullYear(),now.getMonth(),now.getDate()))/1000,true);
});
```

Per default LSC uses the current Unix timestamp for the cache version, if you didn't give a value. This has the effect that the `localStorage` cache will be reloaded every time a guest (re)loads your website, but it will keep the cache during his stay.

Another option could be to manage the site version in a `version.txt` file on your webspace, which simply contains the current version number that you update each time your site changes:

```js
window.addEventListener('load',async ()=>{
	await LSC('cacheName',parseInt(await (await fetch('version.txt')).text()),true);
});
```

In this case your browsers cache would come in effect - to avoid that:

```js
window.addEventListener('load',async ()=>{
	await LSC('cacheName',parseInt(await (await fetch('version.txt?noCache='+(new Date()))).text()),true);
});
```

## Issues with the browser cache

LSC uses the `fetch` method to fetch HTML from the server, which may use the browser cache. That means, if you clear the LSC cache, but you still get old file versions when reloading, this is an effect of the browser cache (even when browsing in private mode). To ensure that you see the latest HTML, you need to

- clear the LSC cache with `LSC.instance.clear(LSC.instance.getCacheVersion());` (`Enter`) (open the JavaScript console with `F12` or `Shift+Ctrl+I`)
- clear the browser cache (somewhere at `Settings` -> `Privacy` -> `Browser data`), be sure to select the temporary data
- reload the page (`Ctrl+R`)

This could be difficult for guests on your website. For this reason, you should configure your app or webserver properly for sending correct cache response headers using reasonable timeouts.

## Issues with the `localStorage` available space

The `localStorage` has different limits for every operating system and browser, and the user is able to configure a different size, too. That means, the available size of the `localStorage` is not reliable and this may cause an error, when LSC is trying to write more data to the `localStorage` than space is available.

In my experience the `localStorage` should actually serve up to 5 MB of data, which is a lot, and may be more than enough for many websites already.

If the cached data becomes too big for storing in the `localStorage`, LSC will clear the cache and start over.

__NOTE__: This issue targets the `sessionStorage`, too!

## Known issues/limitations

LSC tries to convert a multipage website to a single-page-app that renders each pages HTML from the managed `localStorage` cache. To support the browser history it's required to stay within the same document context while displaying the HTML of different pages. For this reason the page initialization events `DOMContentLoaded`, `readystatechanged` and `load` will be raised only once, when loading the initial page. This may cause problems with initialization JavaScript that you want to run for every page. There are two work-arounds for this issue:

1. Use the `onload` attribute of the HTML `body` tag to place initialization JavaScript for a page (don't use `attachEventListener` for this). LCS will execute the script, if the attribute was found.
2. Attach to the `load` and `navigate` event of the `LSC.events` object to run code on the first initialization and every time the HTML of another page was displayed.

The same problem exists with the `beforeunload` and `unload` DOM events. Here you may attach to the `beforenavigate` event of the `LSC.events` object instead.

For websites that rely heavy on JavaScript that depends on the normal page initialization events the browser sends usually, LSC may not be a solution, if you can't manage to modify the event handling :(

Another trap are some techniques to block crawlers (LSC act like a crawler on Speed), which would result the server in responsing with an error status, because LSC sent too many requests within a short time. LSC tries to catch this by not caching responded contents with an error http status code. A solution for this problem could be tracking the mouse cursor and pre-fetching only links that the user may click soon - if the website/server/connection isn't too slow in general.

## Use `sessionStorage` instead of `localStorage`

The `localStorage` isn't good for storing sensitive data, but the `sessionStorage` will be deleted, as soon as the window (tab) closes. If you prefer to use the `sessionStorage` instead of the `localStorage`, you can set to use the `sessionStorage` on startup:

```js
LSC.options.useSessionStorage=true;
```

To switch between `localStorage` and `sessionStorage` later:

```js
LSC.instance.setSessionStorage(true|false);
```

If you've used the `localStorage` before, the cache will be deleted from that storage, when you switch to the `sessionStorage`.

## Extended usage for caching any key/value pairs

The cache isn't limited to caching URI contents only. You could cache any value that can be serialized using `JSON.stringify`:

```js
// Get the current cache object (a JavaScript Map)
const cache=LSC.instance.getCache();

// Set a key/value
cache.set('yourIndividualKey','anyValue');

// Get a value from a key
console.log(cache.get('yourIndividualKey'));

// Determine if the cache contains a value for a key
console.log(cache.has('yourIndividualKey'));

// Delete a key/value from the cache
cache.remove('yourIndividualKey');
```

If you want to do so, please remember that LSC uses the key `version` for storing the current cache version. You shouldn't use this key for any other purpose. And of course you shouldn't use URIs as key, because this could seriously crash the LSC cache contents.

In case you want **only** the inidividual cache, you could disable the link management and then initialize LSC like this:

```js
LSC.extensions=[];// Disable link management by not supporting any URI file extension
await LSC('cacheName',1);
```

__NOTE__: LSC is a singleoton instance. It's not possible to manage more than one cache for a website. You could simulate multiple individual caches by using key-prefixes (f.e. `cachePrefix_key`).

Per default only HTML and XHTML response MIME types are allowed. If you want to use the LSC functions for other MIME types, please use `get` and `update` like this:

```js
// Get any response MIME type using "get"
var response=LSC.instance.get('https://...',false,true);

// Get any response MIME type using "update"
response=LSC.instance.update('https://...',false,true);
```

The 2nd parameter doesn't request with priority (respecting the concurrent fetch-actions), the 3rd parameter allows any response MIME type.

**NOTE**: When using `get` the 3rd parameter won't have any effect, if the requested URI is in the cache already.

## Good to know

Managed links will have the attribute `data-lscmanaged`. To force managing links that would not be managed otherwise, you can add this attribute in your HTML code. To avoid managing a link, add the attribute `data-lscunmanaged`.

When LSC pre-fetched a link URI content, the link will get the attribute `data-lscprefetched`.

## Add-ons

Have a look at the [add-ons index](add-ons/) for more fun with LSC!

## Roadmap

- [ ] Prediction engine extension: Pre-fetch only contents of links that the user may click soon (predicted from the mouse actions)
- [ ] Browser extension: For using LSC with any website on demand
	- [x] Chrominum extension
	- [ ] Firefox extension (waiting for manifest version 3 to be supported)
	- [ ] Safari extension
- [x] Inspector: Find possible issues with a website when using LSC
	- [x] Find `load`, `DOMContentLoaded` and `readystatechanged` event handlers
	- [x] No (or only a few) manageable links (compared to the number of unmanageable links)
- [x] Update current page option for the browser extension
- [ ] Browser cache API support
