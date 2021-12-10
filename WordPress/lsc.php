<?php

if(basename($_SERVER['SCRIPT_FILENAME'])==basename(__FILE__)) exit;

/*
 Plugin Name: LSC
 Plugin URI: https://github.com/nd1012/LSC
 Author: Andreas Zimmermann, wan24.de
 Description: JavaScript localStorage Cache.
 Version 1.0
 License: MIT
 */

// Add the JavaScript to the page
function lsc_js(){
	if(is_admin()) return;
	include __DIR__.(get_option('lsc_min',true)?'/lsc.min.js':'/lsc.js');
	$name=get_option('lsc_cache_name',null);
	$version=intval(get_option('lsc_version',0));
	$preFetch=!!get_option('lsc_prefetch',false);
	?><script>
window.addEventListener('load',async ()=>await LSC(<?php echo $name==''?'null':'"'.preg_quote($name).'"'; ?>,<?php echo $version; ?>,<?php echo $preFetch?'true':'false'; ?>));
</script>
<?php
}
add_action(get_option('lsc_position',true)?'wp_head':'wp_footer','lsc_js');

// Administration extensions
if(is_admin()||current_user_can('administrator')){
	
	// Initialization
	function lsc_admin_init(){
		if(!is_admin()||!current_user_can('administrator')) return;
		foreach(Array('lsc_cache_name','lsc_version','lsc_prefetch','lsc_position','lsc_min') as $option)
			register_setting('lsc',$option);
	}
	add_action('admin_init','lsc_admin_init');
	
	// Configuration menu option
	function lsc_admin(){
		if(!is_admin()||!current_user_can('administrator')) return;
		add_options_page('Configuration','LSC','manage_options','lsc_config','lsc_config');
	}
	function lsc_config(){
		if(!is_admin()||!current_user_can('administrator')) return;
		?><div class="wrap">
<h1>LCS</h1>
<form action="options.php" method="post">
<?php
		settings_fields('lsc');
?><h2>Configuration</h2>
<p>If you won't provide a cache name, LSC will use the domain of your website. If you leave the site version &lt;1, LSC will use the current date and time, which will cache the current session, but renew the cache on the next page visit or reload.</p>
<table class="form-table">
<tr valign="top">
<th scope="row"><label for="lsc_cache_name">Cache name</label></th>
<td><input type="text" name="lsc_cache_name" maxlength="64" id="lsc_cache_name" pattern="[a-z|A-Z|0-9|\-|\.]*" value="<?php echo esc_attr(get_option('lsc_cache_name','')); ?>" size="40" class="regular-text" /></td>
</tr>
<tr valign="top">
<th scope="row"><label for="lsc_version">Site version</label></th>
<td><input type="number" min="0" name="lsc_version" id="lsc_version" value="<?php echo esc_attr(get_option('lsc_version','0')); ?>" size="20" class="regular-text" /></td>
</tr>
<tr valign="top">
<th scope="row">Pre-fetch</th>
<td><label for="lsc_prefetch"><input type="checkbox" name="lsc_prefetch" id="lsc_prefetch" value="1" <?php echo get_option('lsc_prefetch','')?'checked':''; ?> /> Pre-fetch HTML from all local links</label></td>
</tr>
<tr valign="top">
<th scope="row">JavaScript position</th>
<td><label for="lsc_position"><input type="checkbox" name="lsc_position" id="lsc_position" value="1" <?php echo get_option('lsc_position',true)?'checked':''; ?> /> Load LSC in the HTML header</label></td>
</tr>
<tr valign="top">
<th scope="row">Minified</th>
<td><label for="lsc_min"><input type="checkbox" name="lsc_min" id="lsc_min" value="1" <?php echo get_option('lsc_min',true)?'checked':''; ?> /> Use the minified JavaScript</label></td>
</tr>
</table>
<?php
		submit_button();
?>
</form>
</div>
<?php    	
	}
	add_action('admin_menu','lsc_admin');
	
}
