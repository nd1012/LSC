# JavaScript `localStorage` Cache WordPress Plugin

**CAUTION**: __BETA__ version!

1. Use the `lsc.zip` to upload and install the plugin in your WordPress site using the WordPress administration web interface (`Plugins` -> `Install` -> `Upload plugin`)
2. Activate the plugin in the WordPress administration web interface at `Plugins` -> `LSC` -> `Activate`
3. Configure the plugin in the WordPress administration web interface at `Settings` -> `LSC`

You can choose the position within the WordPress generated HTML code, at which LSC should be loaded and initialized. You may disable automatic LSC loading optional, if you plan to integrate the required HTML code by yourself (if you use a DIY theme, f.e.).

## Settings

### Load LSC

If WordPress should load the LSC JavaScript in the header or footer of a site (excluding the administration web interface).

### Cache name

The unique cache name to use.

### Site version

The current site version or zero, to use an automatic version number (latest Unix timestamp).

### Automatic version

You can activate an automatic version number for any WordPress hook that may indicate updated site content (per default `wp_insert_post` and `comment_post`). Up to 1000 hooks may be defined. Every content update will increase the version number by one.

### Browser history

If to support the browser history.

### Pre-fetch

If pre-fetching linked contents is enabled.

### JavaScript position

If WordPress should place the LSC JavaScript in the header or the footer region of a site.

### Session storage

If to use the `sessionStorage` instead of the `localStorage`.

### Minified

If to use the minified LSC JavaScript.

### Webservice token

A secret string that can be used as token to call protected webservice functionality.

### Extensions

This is a comma separated list of additional URI file extensions to manage. Per default `html`, `htm` and `php` are managed - add any additional extensions as required.

## Webservive

The plugin itself `https://uri.to/wp-content/plugins/lsc/lcs.php` does export a simple webservice:

### Get the current LSC site version number

```
https://uri.to/wp-content/plugins/lsc/lcs.php?lsc_action=version
```

This will simply output the version number.

### Increase the current LSC site version number

```
https://uri.to/wp-content/plugins/lsc/lsc.php?lsc_action=increaseversion&lsc_token=...
```

The pre-defined webservice token from the plugin settings needs to be used as value in the `lsc_token` parameter. The version number will be increased by one.

## TODO

- [x] Automatic website versioning by watching updates in the WordPress environment
- [ ] Tests with WordPress default themes
