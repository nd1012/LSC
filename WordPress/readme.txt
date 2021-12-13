=== LSC ===
Contributors: nd1012
Donate link: https://github.com/nd1012/LSC
Tags: javascript, js, localstorage, cache
Requires at least: 5.8
Tested up to: 5.8
Stable tag: 1.0
Requires PHP: 7.4
License: MIT
License URI: https://github.com/nd1012/LSC/blob/main/LICENSE

JavaScript localStorage Cache.

== Description ==

This handy JavaScript will cache the HTML of URIs that have been fetched from your domain in the localStorage of the browser and use that cached HTML next time that URIs are requested from a link. This can make many multipage websites appear super fast, like it's a single-page-app (which will become almost true with LSC) :)

NOTE: Because LSC uses heavy caching, less or more requests will be sent to your webserver, which can affect the statistics from the webserver's logfile.

== Frequently Asked Questions ==

= What's the opportunity to use the localStorage as cache instead of the normal browser cache? =

LSC allows versioning your website and offers more control over caching, while the browser cache can only be managed by the user and by using cache headers at the server side.

In addition LSC can pre-fetch contents. If the user clicks on a link to an URI which contents have been pre-fetched, the page will display withour any noticable delay.

= Can this run on any website? =

Unfortunately no. The existing JavaScript needs to be compatible with LSC, which means, if it strictly relies on DOM events like DOMContentLoaded, readystatechanged, load, beforeunload and unload, it has to be modified, or it may not run. For the load event it may help to put the code in the onload attribute of the HTML body tag, because LSC will invoke this code every time a new page is being displayed.

A clear incompatibility may be that a used JavaScript simply doesn't assume that the whole document content could change, or that it may be bootstrapped multiple times within one document context.

But fortunately LSC should be able to run on most websites without you having to modify anything too much :)

= Is LSC compatible with other WordPress plugins? =

LSC should be compatible with all WordPress plugins that do not require the page to be reloaded using the new URI with every user click.

== Screenshots ==

1. LSC plugin settings in the WordPress administration web interface

== Changelog ==

= 1.0 =
* Initial release

== Upgrade Notice ==

= 1.0 =
Initial release.

== A brief Markdown Example ==

For a full description and detailled code examples and a demonstration environment, please visit the [GitHub project site](https://github.com/nd1012/LSC).

Up to date informations about this plugin are available on the [WordPress plugin site](https://github.com/nd1012/LSC/tree/main/WordPress).

To use the LSC webservice to increase the version number, you need to set a webservice token in the plugin settings first. Then:

	https://uri.to/wp-content/plugins/lsc/lcs.php?lsc_action=increaseversion&lsc_token=...

Getting the current version number works without the webservice token:

	https://uri.to/wp-content/plugins/lsc/lcs.php?lsc_action=version
