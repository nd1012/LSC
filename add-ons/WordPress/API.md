# LSC - JavaScript `localStorage` Cache WordPress plugin API

This reference contains some detail information about functions you may use in your WordPress plugin or theme to control LSC at the backend side. Please note that these functions can run in any user context and won't validate administrator privileges!

## Get the LSC JavaScript filename

```php
$file=lsc_js_file();
```

This function returns the filename without a path (minified, if configured).

## Get the LSC JavaScript URI

```php
$uri=lsc_js_uri();
```

This function returns the absolute URI to the LSC JavaScript (minified, if configured).

## Match an URI against the exclude/include rules

```php
$rules=lsc_exclude_uris();// Or lsc_include_uris()
$match=lsc_match('https://...',$rules);
if($match){
	echo 'Matched!';
}else{
	echo 'Not matched.';
}
```

Using this function you can check if an URI is matched by the exclude/include rules.

## Get the settings

```php
$settings=lsc_settings();
$defaults=lsc_settings(true);
```

This function returns all settings or the defaults. The defaults exclude:

- Auto versioning hook information
- Exclude URIs
- Include URIs

These values are only included in the non-defaults.

## Enqueue the LSC JavaScript

```php
lsc_js_enqueue($force);
```

`$force` may be `true`, if you want to force loading LSC even if it was disabled in the settings.

## Output the LSC JavaScript for initialization

```php
lsc_js($force);
```

`$force` may be `true`, if you want to force the output. However, this method can only be called once. If you'd call it a second time, even with `$force=true` the function won't produce a second output to avoid double LSC initialization.

## Get the auto versioning hook information

```php
print_r(lsc_autoversion_options());
```

The returned array contains the WordPress hook as key, and the information as value. To determine if a hook is enabled:

```php
if(get_option('lsc_autoversion_hook_name')){
	echo 'Enabled';
}else{
	echo 'Disabled';
}
```

You need to prefix `lsc_autoversion_` to the WordPress hook name to get the option value.

## Increase the site version number

```php
lsc_autoversion();
```

This function can only be called once within the same PHP process.

## Get the excludes

```php
$exclude=lsc_exclude_uris();
```

## Get the includes

```php
$include=lsc_include_uris();
```

## Get the LSC JavaScript version number

```php
$version=lsc_version();
```

The returned value is an integer.

## Get the LSC WordPress plugin version

```php
$version=lsc_plugin_version();
```

The returned value is a string like `1.0`.
