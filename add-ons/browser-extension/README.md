# LSC browser extension

This browser extension allows you to use LSC with any website.

Folders:

- [Chrominum](chrome/) - Extension compatible with these browsers (f.e.):
	- Google Chrome
	- Microsoft Edge
	- Vivaldi
	- Brave
- [Safari](safari/) - Apple Safari extension

For Firefox I'm waiting for Mozilla to support the manifest version 3, first (which is announced already and should be released very soon (now December 2021)).

## Installation

Unless the extensions are available in the official extension stores, you'll have to install them manually. To do this, it's required to download the extension folder to your local harddisc and enable the extension developer mode in your browser. Then you can install the extension from its folder (some browser call it "Unpacked extension").

## Usage

After you installed the extension, you'll see a rocket icon beside the browsers address bar. Navigate to any website and click the rocket icon to launch LSC. Optional you can adjust the settings, or simply click the "Close" button to close the popup an continue using the website. Once you've launched LSC for a website, next time you visit the website LSC will be launched automatic.

The "Disable" button will delete the cache and disable LSC by reloading the website (LSC won't be launched automatic for that website anymore).

If you want to fetch up to date versions of the linked contents that are cached currently, you can click the "Clear cache" button to clear all cached contents. This will force LSC to reload the content of a link from the server, when you click on it.

The extension icon may change during you use the website:

- **Black or silver rocket** (depends on dark/light mode): LSC is not running for the active tab
- **Red rocket**: LSC is inactive (on error, or when the content type isn't supported) for the active tab
- **Orange rocket** on black background: LSC is currently pre-fetching linked contents for the active tab from the server
- **Green rocket** on black background: LSC finished pre-fetching linked contents for the active tab and is ready to serve, when you click on a managed link

### Options

#### Plugin options

- Pre-fetch: If linked contents should be pre-fetched
- sessionStorage: To delete the cache when you close the tab/window
- Daily refresh: Keep the cached contents for the current day (instead of for the current session only)

#### Page options

The plugin options will be used as defaults for the page options:

- sessionStorage
- Daily refresh

These options can be customized and will be stored for each website.

## Third party licenses

### HTML i18n library

[HTML i18n](https://github.com/nd1012/HTML-i18n) uses the [MIT license](https://github.com/nd1012/HTML-i18n/blob/main/LICENSE).

### Icons

I purchased a commercial license that allows me as license owner to use the icons of this browser extension. If you want to fork this project, you will need to obtain the same license (contact me for details), exchange the used icons or declare your work as private and free (in this case you'll need to add an attribution - contact me for details).
