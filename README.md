# JavaScript `localStorage` Cache

This handy JavaScript will cache the HTML of URIs that have been fetched from your domain in the `localStorage` of the browser and use that cached HTML next time that URIs are requested from a link. This can make many multipage websites appear super fast, like it's a single-page-app (which will become almost true with LSC) :)

**NOTE**: Because LSC uses heavy caching, less or more requests will be sent to your webserver, which can affect the statistics from the webserver's logfile.

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
		LSC.extensions.push('md');
		
		// Run LSC in the window load event
		window.addEventListener('load',()=>LSC('cacheName',1,true));
		
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
2. (optional) The current page version number (increase the version number, if you want all browser caches to update) (default: todays date)
3. (optional) If URIs from links on the page to your domain should be pre-fetched (default: `false`)

On page load LSC will dispatch the `navigate` event on the `LSC.events` object.

LSC handles the click event of links (`A` tags without `target` attribute) that

- call the current domain
- don't contain GET parameters
- don't contain an anchor
- end with a supported file extension

Per default the extensions `html`, `htm` and `php` are supported. Add more extensions to the `LSC.extensions` list, if required.

If a managed link was clicked, the browser address bar will update, and even the browser history will get a new entry and supports the back-button as usual. The only difference is: If the link target was cached already, no http request will be sent, but the cached HTML will be used instead.

Find an online demonstration [here](https://nd1012.github.io/LSC/index.html).

**NOTE**: If you defined an event handler in the `body` html tag's `onload` attribute, on each navigation the handler will be executed, but the `load` event won't fire as usual - which means: If you used `addEventListener` to attach to the `load` event etc., they won't be called. Attach to the `navigate` event on the `LSC.events` object instead. Other events (like `beforeunload`, `unload`, `DOMContentLoaded`, `readystatechanged` etc.) will be omitted. For `unload` you can attach to the `beforenavigate` event in the `LSC.events` object.

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

### Events

The `LSC.events` object can raise these events:

- `manage`: Attached to links in the HTML document do manage clicks (will provide a list of all managed link elements)
- `beforenavigate`: Before navigating to a new URI (can't be cancelled)
- `navigated`: After navigated to a new URI
- `update`: After fetched HTML for an URI (and before storing it in the cache - the `html` in the event object may be manipulated)
- `updated`: After a fetched HTML has been written to the cache
- `clear`: After cleared/initialized the cache map
- `store`: Before storing the cache to the `localStorage` (you may modify the cache before writing to the storage)
- `history`: After navigated in the browser history
- `load`: LSC initialized (raised only once for the singleton instance)
- `error`: Failed to fetch an URI

## Automatic renewal of browser caches

You could force an automatic renewal of the LSC cache, if you use an automatic version when initializing LSC. For example, you could use the Unix timestamp of the current day as version number to ensure that tomorrow all browsers will reload HTML contents from your webserver - example:

```html
...
<body onload="let now=new Date();LSC('cacheName',(new Date(now.getFullYear(),now.getMonth(),now.getDate()))/1000,true);">
...
```

Per default LSC uses the current Unix timestamp for the cache version, if you didn't give a value. This has the effect that the `localStorage` cache will be reloaded every time a guest (re)loads your website, but it will keep the cache during his stay.

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

## Known issues/limitations

LSC tries to convert a multipage website to a single-page-app that renders each pages HTML from the managed `localStorage` cache. To support the browser history it's required to stay within the same document context while displaying the HTML of different pages. For this reason the page initialization events `DOMContentLoaded`, `readystatechanged` and `load` will be raised only once, when loading the initial page. This may cause problems with initialization JavaScript that you want to run for every page. There are two work-arounds for this issue:

1. Use the `onload` attribute of the HTML `body` tag to place initialization JavaScript for a page (don't use `attachEventListener` for this). LCS will execute the script, if the attribute was found.
2. Attach to the `load` and `navigate` event of the `LSC.events` object to run code on the first initialization and every time the HTML of another page was displayed.

The same problem exists with the `beforeunload` and `unload` DOM events. Here you may attach to the `beforenavigate` event of the `LSC.events` object instead.

For websites that rely heavy on JavaScript that depends on the normal page initialization events the browser sends usually, this may not be a solution :(

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

## WordPress plugin

LSC is also available as [WordPress plugin](WordPress/).
