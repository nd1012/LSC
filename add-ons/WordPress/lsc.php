<?php

/*
 Plugin Name: LSC
 Plugin URI: https://github.com/nd1012/LSC
 Author: Andreas Zimmermann, wan24.de
 Author URI: https://github.com/nd1012
 Description: JavaScript localStorage Cache.
 Version 1.0
 License: MIT
 */

if(!function_exists('lsc_autoversion_options')):// Prevent double loading

// Run webservice
if(basename($_SERVER['SCRIPT_FILENAME'])==basename(__FILE__)){
	// Initialize WordPress
	ob_start();
	while(!file_exists('wp-load.php'))
		if(!chdir('../'))
			trigger_error('Failed to include wp-load.php',E_USER_ERROR);
	require_once 'wp-load.php';
	// Validate the action parameter
	if(!isset($_REQUEST['lsc_action'])||$_REQUEST['lsc_action']=='')
		trigger_error('LSC webservice call without action parameter',E_USER_ERROR);
	// Perform actions without token
	switch($_REQUEST['lsc_action']){
		case 'version':
			// Display the current LSC cache version number
			echo get_option('lsc_version');
			exit;
	}
	// Validate the token
	if(
		!isset($_REQUEST['lsc_token'])||
		$_REQUEST['lsc_token']==''||
		wp_unslash($_REQUEST['lsc_token'])!=get_option('lsc_token','')
		)
		trigger_error('LSC webservice call without valid token',E_USER_ERROR);
	// Perform actions with token
	switch($_REQUEST['lsc_action']){
		case 'increaseversion':
			// Increase and display the LSC cache version number
			update_option('lsc_version',$version=intval(get_option('lsc_version',0))+1);
			echo $version;
			exit;
		default:
			trigger_error('Invalid/unknown action "'.$_REQUEST['lsc_action'].'"',E_USER_ERROR);
			exit;
	}
	exit;
}

// Get the LSC JavaScript version
function lsc_version(){
	return 3;
}

// Get the LSC WordPress Plugin version
function lsc_plugin_version(){
	return '1.1';
}

// Add the JavaScript to the page
function lsc_js_enqueue($force=false){
	if(is_admin()||(!$force&&!get_option('lsc_load',true))) return;
	wp_enqueue_script(
		'LSC',
		lsc_js_uri(),
		Array(),
		(string)filemtime(__DIR__.'/'.lsc_js_file()),
		!get_option('lsc_position',true)
		);
}
function lsc_js($force=false){
	if(defined('LSC_JS')||is_admin()||(!$force&&!get_option('lsc_load',true))) return;
	define('LSC_JS',true);
	$name=get_option('lsc_cache_name',null);
	$version=intval(get_option('lsc_version',0));
	$preFetch=!!get_option('lsc_prefetch',false);
	$history=!!get_option('lsc_history',true);
	$extensions=explode(',',get_option('lsc_extensions',''));
	$quiet=!!get_option('lsc_quiet',false);
	$max=intval(get_option('lsc_max',0));
	$exclude=lsc_exclude_uris();
	$include=lsc_include_uris();
	$limit=intval(get_option('lsc_limit',5));
	?><script>
if(window.LSC&&!LSC.instance){
<?php
	if(!$history):// History option
		?>	LSC.options.history=false;
<?php
	endif;// End history option
	if($quiet):// Quiet option
		?>	LSC.options.quiet=true;
<?php
	endif;// End quiet option
	if($extensions[0]!=''):// Extensions option
		?>	LSC.extensions.push(...<?php echo json_encode($extensions); ?>);
<?php
	endif;// End extension options
	if($max):// Max. number of cached entries
	?>	LSC.options.maxEntries=<?php echo $max; ?>;
<?php
	endif;// End max. number of cached entries
	if($exclude&&count($exclude)):// Exclude URIs
	?>	LSC.exclude.push(...<?php echo json_encode($exclude); ?>);
<?php
	endif;// End exclude URIs
	if($include&&count($include)):// Include URIs
	?>	LSC.include.push(...<?php echo json_encode($include); ?>);
<?php
	endif;// End include URIs
	?>	LSC.options.maxConcurrentFetch=<?php echo $limit; ?>;
	window.addEventListener(
		'load',
		async ()=>await LSC(
			<?php echo $name==''?'null':'"'.preg_quote($name,'"').'"'; ?>,
			<?php echo $version; ?>,
			<?php echo $preFetch?'true':'false'; ?>
			)
		);
	let wpAdminUri="<?php echo preg_quote(get_admin_url(),'"'); ?>",
		wpAdminUriLen=wpAdminUri.length;
	LSC.events.addEventListener('beforemanage',(e)=>e.detail.manage=e.detail.preFetch=e.detail.link.href.substring(0,wpAdminUriLen)!=wpAdminUri);
}else if(!window.LSC){
	console.error('Failed to load LSC');
}
</script>
<?php
}
if(!is_admin()&&!!get_option('lsc_load',true)){
	add_action('wp_enqueue_scripts','lsc_js_enqueue',PHP_INT_MAX-1,0);
	add_action(!!get_option('lsc_position',true)?'wp_head':'wp_footer','lsc_js',PHP_INT_MAX-1,0);
}

// Automatic site version increase
function &lsc_autoversion_options(){
	return ($options=get_option('lsc_autoversion_options',null))?$options:$options=Array(
		'wp_insert_post'=>'On post insert/update',
		'comment_post'=>'On post comment'
	);
}
function lsc_autoversion(){
	if(!defined('LSC_VERSION_AUTOUPDATE')){
		update_option('lsc_version',$version=intval(get_option('lsc_version',0))+1);
		define('LSC_VERSION_AUTOUPDATE',$version);
	}
	return LSC_VERSION_AUTOUPDATE;
}
if(!!get_option('lsc_autoversion',false))
	foreach(array_keys(lsc_autoversion_options()) as $hook)
		if(!!get_option('lsc_autoversion_'.$hook,true))
			add_action($hook,'lsc_autoversion',10,0);

// Exclude/include URIs
function &lsc_exclude_uris(){
	return ($uris=get_option('lsc_exclude',null))?$uris:$uris=Array();
}
function &lsc_include_uris(){
	return ($uris=get_option('lsc_include',null))?$uris:$uris=Array();
}

// Admin initialization
function lsc_admin_init(){
	if(!is_admin()||!current_user_can('administrator')) return;
	// Register options
	foreach(lsc_settings(true) as $option=>$def){
		register_setting('lsc',$option);
		if(is_null(get_option($option,null)))
			add_option($option,$def);
	}
	// Define internal options
	foreach(Array('lsc_autoversion_options','lsc_exclude','lsc_include') as $option)
		if(!get_option($option,null))
			add_option($option,Array());
	// Parse parameters
	$param=Array();
	foreach($_POST as $key=>$value)
		if(preg_match('/^option_page|action|(delete_)?lsc_(autoversion|exclude|include)_.+$/',$key))
			$param[$key]=strip_tags((string)wp_unslash($value));
	// Return, if settings wheren't updated
	if(!isset($param['option_page'])||$param['option_page']!='lsc'||!isset($param['action'])||$param['action']!='update')
		return;
	// Store autoversion settings
	$options=Array();
	$cnt=0;
	foreach($param as $key=>$value){
		// Skip unknown parameters
		if(!preg_match('/^(delete_)?lsc_autoversion_[a-z|0-9]+(_[a-z|0-9]+)+$/',$key)) continue;
		// Get the hook name and the option ID
		$option=substr(preg_replace('/^(delete_)?lsc_autoversion_([a-z|0-9]+(_[a-z|0-9]+)+)$/',"$2",$key),0,64);
		$id='lsc_autoversion_'.$option;
		if(substr($key,0,7)=='delete_'){
			// Delete a hook
			delete_option($id);
			unregister_setting('lsc',$id);
			continue;
		}
		// Skip incomplete/other parameters
		if(!isset($param[$key.'__info'])||substr($key,0,16)!='lsc_autoversion_') continue;
		// Validate the max. number of hooks
		$cnt++;
		if($cnt>1000){
			if($cnt==1001) add_settings_error($id,$id,'Too many hooks defined (max. 1000)','error');
			continue;
		}
		// Register the setting and set the current option
		register_setting('lsc',$id);
		$options[$option]=substr($param[$key.'__info'],0,256);
		if(is_null(get_option($id,null))){
			add_option($id,!!$value);
		}else{
			update_option($id,!!$value);
		}
	}
	update_option('lsc_autoversion_options',$options);
	// Store exclude URIs
	$uris=Array();
	$cnt=0;
	foreach($param as $key=>$value){
		if(!preg_match('/^lsc_exclude_[^_]+$/',$key)) continue;
		$cnt++;
		if($cnt>100){
			if($cnt==101) add_settings_error($key,$key,'Too many exclude URIs defined (max. 100)','error');
			continue;
		}
		$uris[]=$value;
	}
	update_option('lsc_exclude',$uris);
	// Store include URIs
	$uris=Array();
	$cnt=0;
	foreach($param as $key=>$value){
		if(!preg_match('/^lsc_include_[^_]+$/',$key)) continue;
		$cnt++;
		if($cnt>100){
			if($cnt==101) add_settings_error($key,$key,'Too many include URIs defined (max. 100)','error');
			continue;
		}
		$uris[]=$value;
	}
	update_option('lsc_include',$uris);
}
add_action('admin_init','lsc_admin_init',10,0);

if(is_admin()){
	// Configuration menu option
	function lsc_admin(){
		if(is_admin()&&current_user_can('administrator'))
			add_options_page('Configuration','LSC','manage_options','lsc_config','lsc_config');
	}
	function lsc_config(){
		if(!is_admin()||!current_user_can('administrator')) return;
		?><style type="text/css">
#lsc_options_form span.deleted label,#lsc_options_form span.deleted code{
	text-decoration:line-through;
}
</style>
<div class="wrap">
<h1>LSC - JavaScript <strong>localStorage</strong> Cache</h1>
<form action="options.php" method="post">
<?php
		settings_fields('lsc');
	?><h2>Configuration</h2>
<p>Disable automatic LSC loading, if you plan to load the JavaScript and integrate the required HTML by yourself (in your DIY theme, f.e.).</p>
<p>Per default the URI file extensions <strong>html</strong>, <strong>htm</strong> and <strong>php</strong> are managed. You may add a comma separated list of additional extensions as required.</p>
<p>A small webservice allows you to fetch the current site version, or increase the site version number (if you provide the configured secret webservice token).</p>
<p>For a deeper description of these settings please visit the <a href="https://github.com/nd1012/LSC" target="_blank">LSC project page on GitHub</a>.</p>
<div id="lsc_autoversion_template" hidden="hidden"><span id="lsc_autoversion_template_span">&nbsp;&nbsp;&nbsp;&nbsp;<label for="lsc_autoversion_template_input"><input type="checkbox" name="lsc_autoversion_template_input" id="lsc_autoversion_template_input" value="1" checked="checked" /></label> <small>(<a href="">Delete</a>)</small><br /><input type="hidden" name="lsc_autoversion_template_info" value="" /></span></div>
<div id="lsc_exclude_template" hidden="hidden"><span id="lsc_exclude_template_span"><code></code> <small>(<a href="">Delete</a>)</small><br /><input type="hidden" name="lsc_exclude_template_uri" value="" /></span></div>
<div id="lsc_include_template" hidden="hidden"><span id="lsc_include_template_span"><code></code> <small>(<a href="">Delete</a>)</small><br /><input type="hidden" name="lsc_include_template_uri" value="" /></span></div>
<table class="form-table" id="lsc_options_form">
<tr valign="top">
<th scope="row">Load LSC</th>
<td><label for="lsc_load"><input type="checkbox" name="lsc_load" id="lsc_load" value="1" <?php echo get_option('lsc_load',true)?'checked="checked"':''; ?> /> Load the LSC JavaScript</label></td>
</tr>
<tr valign="top">
<th scope="row">Minified</th>
<td><label for="lsc_min"><input type="checkbox" name="lsc_min" id="lsc_min" value="1" <?php echo get_option('lsc_min',true)?'checked="checked"':''; ?> /> Use the minified JavaScript version</label></td>
</tr>
<tr valign="top">
<th scope="row">JavaScript position</th>
<td><label for="lsc_position"><input type="checkbox" name="lsc_position" id="lsc_position" value="1" <?php echo get_option('lsc_position',true)?'checked="checked"':''; ?> /> Load LSC in the HTML header (disable to load in the footer)</label></td>
</tr>
<tr valign="top">
<th scope="row"><label for="lsc_cache_name">Cache name</label></th>
<td><input type="text" name="lsc_cache_name" maxlength="64" id="lsc_cache_name" pattern="[a-z|A-Z|0-9|\-|\.|_]*" value="<?php echo esc_attr(get_option('lsc_cache_name','')); ?>" size="40" class="regular-text" /><br />
<small><strong>Hint:</strong> Leave the value empty to use your wwebsites hostname.</small></td>
</tr>
<tr valign="top">
<th scope="row"><label for="lsc_version">Site version</label></th>
<td><input type="number" min="0" name="lsc_version" id="lsc_version" value="<?php echo esc_attr(get_option('lsc_version','0')); ?>" size="20" class="regular-text" /><br />
<small><strong>Hint:</strong> Set a zero value for using the current Unix timestamp always.</small></td>
</tr>
<tr valign="top" id="lsc_autoversion_row">
<th scope="row">Automatic version</th>
<td><label for="lsc_autoversion"><input type="checkbox" name="lsc_autoversion" id="lsc_autoversion" value="1" <?php echo get_option('lsc_autoversion',false)?'checked="checked"':''; ?> /> Automatic site version number increase</label><br />
<?php
		foreach(lsc_autoversion_options() as $option=>$info){
			$attr=esc_attr('lsc_autoversion_'.$option);
			?><span id="<?php echo $attr; ?>_span">&nbsp;&nbsp;&nbsp;&nbsp;<label for="<?php echo $attr; ?>"><input type="checkbox" name="<?php echo $attr; ?>" id="<?php echo $attr; ?>" value="1" <?php echo get_option('lsc_autoversion_'.$option,true)?'checked="checked"':''; ?> /> <?php echo esc_html($info); ?></label> <small>(<a href="javascript:lsc_delete_option('<?php echo esc_html(preg_quote('lsc_autoversion_'.$option,"'")); ?>');">Delete</a>)</small><br /><input type="hidden" name="<?php echo $attr.'__info'; ?>" value="<?php echo esc_attr($info); ?>"></span>
<?php
		}
		?><p class="addNewHook"><strong>Add new hook</strong></p>
<p><small><strong>Hint:</strong> You can add WordPress hooks as required. Every time a hook was executed, the site version will be increased.</small></p>
<p><label for="lsc_new_hook">WordPress hook name:<br />
<input type="text" max="64" name="lsc_new_hook" id="lsc_new_hook" size="40" class="regular-text" /></label><br />
<label for="lsc_new_info">Information:<br />
<input type="text" max="256" name="lsc_new_info" id="lsc_new_info" size="40" class="regular-text" /></label><br />
<input type="button" value="Add hook" onclick="lsc_add_option();" /></p>
</tr>
<tr valign="top">
<th scope="row">Browser history</th>
<td><label for="lsc_history"><input type="checkbox" name="lsc_history" id="lsc_history" value="1" <?php echo get_option('lsc_history',true)?'checked="checked"':''; ?> /> Manage and support the browser history</label></td>
</tr>
<tr valign="top">
<th scope="row">Pre-fetch</th>
<td><label for="lsc_prefetch"><input type="checkbox" name="lsc_prefetch" id="lsc_prefetch" value="1" <?php echo get_option('lsc_prefetch',false)?'checked="checked"':''; ?> /> Pre-fetch HTML from all local links</label></td>
</tr>
<tr valign="top">
<th scope="row">Session storage</th>
<td><label for="lsc_usess"><input type="checkbox" name="lsc_usess" id="lsc_usess" value="1" <?php echo get_option('lsc_usess',false)?'checked="checked"':''; ?> /> Use the <strong>sessionStorage</strong> instead of the <strong>localStorage</strong></label></td>
</tr>
<tr valign="top">
<th scope="row"><label for="lsc_extensions">Managed extensions</label></th>
<td><input type="text" name="lsc_extensions" maxlength="256" id="lsc_extensions" value="<?php echo esc_attr(get_option('lsc_extensions','')); ?>" size="40" class="regular-text" /><br />
<small><strong>Hint:</strong> Per default <strong>html</strong>, <strong>htm</strong> and <strong>php</strong> are managed. Add more extensions comma separated.</small></td>
</tr>
<tr valign="top" id="lsc_exclude_row">
<th scope="row">Exclude URIs</th>
<td><?php
		foreach(lsc_exclude_uris() as $uri){
			$attr=esc_attr($id='lsc_exclude_'.strtolower(uniqid()));
			?><span id="<?php echo $attr; ?>_span"><code><?php echo esc_html($uri); ?></code> <small>(<a href="javascript:lsc_delete_exclude('<?php echo esc_html(preg_quote($id,"'")); ?>');">Delete</a>)</small><br /><input type="hidden" name="<?php echo $attr; ?>" value="<?php esc_attr($uri); ?>" /></span>
<?php
		}
?><p class="addNewExclude"><strong>Add new exclude</strong></p>
<p><label for="lsc_new_exclude">URI or regular expression:<br />
<input type="text" min="7" max="256" name="lsc_new_exclude" id="lsc_new_exclude" size="40" class="regular-text" /></label><br />
<small><strong>Hint:</strong> Use &quot;<strong>/</strong>&quot; as delimiter for defining a regular expression.</small><br />
<input type="button" value="Add exclude" onclick="lsc_add_exclude();" /></p>
</td>
</tr>
<tr valign="top" id="lsc_include_row">
<th scope="row">Include URIs</th>
<td><?php
		foreach(lsc_include_uris() as $uri){
			$attr=esc_attr($id='lsc_include_'.strtolower(uniqid()));
			?><span id="<?php echo $attr; ?>_span"><code><?php echo esc_html($uri); ?></code> <small>(<a href="javascript:lsc_delete_include('<?php echo esc_html(preg_quote($id,"'")); ?>');">Delete</a>)</small><br /><input type="hidden" name="<?php echo $attr; ?>" value="<?php esc_attr($uri); ?>" /></span>
<?php
		}
?><p class="addNewInclude"><strong>Add new include</strong></p>
<p><label for="lsc_new_include">URI or regular expression:<br />
<input type="text" min="7" max="256" name="lsc_new_include" id="lsc_new_include" size="40" class="regular-text" /></label><br />
<small><strong>Hint:</strong> Use &quot;<strong>/</strong>&quot; as delimiter for defining a regular expression. An include will override an exclude.</small><br />
<input type="button" value="Add include" onclick="lsc_add_include();" /></p>
</td>
<tr valign="top">
<th scope="row">Quiet</th>
<td><label for="lsc_quiet"><input type="checkbox" name="lsc_quiet" id="lsc_quiet" value="1" <?php echo get_option('lsc_quiet',true)?'checked="checked"':''; ?> /> Write only warnings, errors and debug information to the JavaScript console</label></td>
</tr>
<tr valign="top">
<th scope="row"><label for="lsc_max">Max. # of cached entries</label></th>
<td><input type="number" min="0" name="lsc_max" id="lsc_max" value="<?php echo esc_attr(get_option('lsc_max','0')); ?>" size="20" class="regular-text" /><br />
<small><strong>Tip:</strong> Enter a value of zero to disable the maximum number of cached entries.</small></td>
</tr>
<tr valign="top">
<th scope="row"><label for="lsc_limit">Concurrent fetch limit</label></th>
<td><input type="number" min="1" max="20" name="lsc_limit" id="lsc_limit" value="<?php echo esc_attr(get_option('lsc_limit','5')); ?>" size="20" class="regular-text" /></td>
</tr>
<tr valign="top">
<th scope="row"><label for="lsc_token">Webservice token</label></th>
<td><input type="text" name="lsc_token" maxlength="256" id="lsc_token" value="<?php echo esc_attr(get_option('lsc_token','')); ?>" size="40" class="regular-text" /><br />
The URI to the webservice is: <strong><?php echo plugins_url('lsc.php',__FILE__); ?></strong></td>
</tr>
</table>
<?php
		submit_button();
	?>
</form>
<script type="text/javascript">
if(typeof window.lsc_add_option=='undefined'){
	function lsc_add_option(){
			// New hook name
		const newHook=document.getElementById('lsc_new_hook'),
			// New hook info
			newInfo=document.getElementById('lsc_new_info'),
			// ID of the new option
			id='lsc_autoversion_'+newHook.value,
			// Existing option
			existing=document.querySelector('#'+id+'_span'),
			// New option template
			tmpl=existing?null:document.getElementById('lsc_autoversion_template'),
			// New option
			newOption=existing?null:tmpl.firstChild.cloneNode(true),
			// Insert before element
			before=existing?null:document.querySelector('#lsc_autoversion_row .addNewHook');
		// Validate the hook name
		if(!existing&&!/^[a-z|0-9]+(_[a-z|0-9]+)+$/.test(newHook.value)){
			alert('Invalid WordPress hook name');
			return false;
		}
		// Validate the hook info
		if(newInfo.value.length<1){
			alert('Option information required');
			return false;
		}
		// Handle an existing option
		if(existing){
			// Validate existing not deleted option
			if(!document.getElementById('delete_'+id)){
				alert('WordPress hook defined already');
				return false;
			}
			// Undelete and update the existing option
			lsc_undelete_option(id);
			let label=document.getElementById(id).parentNode;
			label.removeChild(label.lastChild);
			label.appendChild(document.createTextNode(newInfo.value));
			document.querySelector('input[name="'+id+'__info"]').value=newInfo.value;
			// Clear the form
			newHook.value='';
			newInfo.value='';
			return false;
		}
		// Create a new option
		newOption.setAttribute('id',id+'_span');
		before.parentNode.insertBefore(newOption,before);
			// Label
		const label=document.querySelector('#'+id+'_span label'),
			// Checkbox
			check=document.querySelector('#'+id+'_span label input[type="checkbox"]'),
			// Hidden input
			hidden=document.querySelector('#'+id+'_span input[type="hidden"]'),
			// (Un)Delete link
			link=document.querySelector('#'+id+'_span a'),
			// Info text
			text=document.createTextNode(' '+newInfo.value);
		label.setAttribute('for',id);
		check.setAttribute('id',id);
		check.setAttribute('name',id);
		hidden.setAttribute('name',id+'__info');
		hidden.setAttribute('value',newInfo.value);
		label.appendChild(text);
		link.setAttribute('href','javascript:lsc_delete_option("'+lsc_escape_id(id)+'");');
		// Clear the form
		newHook.value='';
		newInfo.value='';
		return false;
	}
	function lsc_delete_option(id){
		// Delete an option
		document.getElementById(id+'_span').className='deleted';
		const check=document.getElementById(id);
		check.setAttribute('id','delete_'+id);
		check.setAttribute('name','delete_'+id);
		check.setAttribute('readonly','readonly');
		const link=document.querySelector('#'+id+'_span a');
		link.innerText='Undelete';
		link.setAttribute('href','javascript:lsc_undelete_option("'+lsc_escape_id(id)+'");');
	}
	function lsc_undelete_option(id){
		// Undelete an option
		document.getElementById(id+'_span').className='';
		const check=document.getElementById('delete_'+id);
		check.setAttribute('id',id);
		check.setAttribute('name',id);
		check.removeAttribute('readonly');
		const link=document.querySelector('#'+id+'_span a');
		link.innerText='Delete';
		link.setAttribute('href','javascript:lsc_delete_option("'+lsc_escape_id(id)+'");');
	}
	function lsc_add_exclude(){
			// New exclude URI
		const newUri=document.getElementById('lsc_new_exclude'),
			// ID of the new exclude
			id='lsc_exclude_'+Math.floor(Math.random()*Number.MAX_SAFE_INTEGER-0),
			// Existing
			existing=document.querySelector('#lsc_exclude_row input[type="hidden"][value="'+lsc_escape_id(newUri.value)+'"]');
			// New exclude template
			tmpl=existing?null:document.getElementById('lsc_exclude_template'),
			// New exclude
			newExclude=existing?null:tmpl.firstChild.cloneNode(true),
			// Insert before element
			before=existing?null:document.querySelector('#lsc_exclude_row .addNewExclude');
		if(existing){
			// Validate deleted existing exclude
			if(!document.querySelector('#'+lsc_escape_id(existing.getAttribute('name').substring(7))+'_span.deleted')){
				alert('Exclude exists already');
				return false;
			}
			lsc_undelete_exclude(existing.getAttribute('name').substring(7));
		}else{
			// Create a new exclude
			if(newUri.value.substring(0,1)=='/'){
				try{
					if(!/^\/.*\/[a-z]*$/.test(newUri.value)) throw new Error('Invalid syntax');
					new RegEx(newUri.value.replace(/^(\/.*\/)[a-z]*$/,"$1"),newUri.value.replace(/^\/.*\/([a-z]*)$/,"$1"));
				}catch(ex){
					alert('Invalid regular expression: '+ex.getMessage());
					return false;
				}
			}else if(!/^https?\:\/\/.+/i.test(newUri.value)){
				alert('Invalid URI');
				return false;
			}
			newExclude.setAttribute('id',id+'_span');
			before.parentNode.insertBefore(newExclude,before);
			const code=newExclude.childNodes[0],
				link=document.querySelector('#'+lsc_escape_id(id)+'_span a'),
				hidden=document.querySelector('#'+lsc_escape_id(id)+'_span input');
			code.innerText=newUri.value;
			link.setAttribute('href','javascript:lsc_delete_exclude("'+lsc_escape_id(id)+'");');
			hidden.setAttribute('name',id);
			hidden.setAttribute('value',newUri.value);
		}
		// Clear the form
		newUri.value='';
		return false;
	}
	function lsc_delete_exclude(id){
		// Delete an exclude
		const span=document.getElementById(id+'_span'),
			link=document.querySelector('#'+span.id+' a'),
			hidden=document.querySelector('#'+span.id+' input');
		span.className='deleted';
		link.innerText='Undelete';
		link.setAttribute('href','javascript:lsc_undelete_exclude("'+lsc_escape_id(id)+'");');
		hidden.setAttribute('name','delete_'+hidden.name);
	}
	function lsc_undelete_exclude(id){
		// Undelete an exclude
		const span=document.getElementById(id+'_span'),
			link=document.querySelector('#'+span.id+' a'),
			hidden=document.querySelector('#'+span.id+' input');
		span.className='';
		link.innerText='Delete';
		link.setAttribute('href','javascript:lsc_delete_exclude("'+lsc_escape_id(id)+'");');
		hidden.setAttribute('name',id);
	}
	function lsc_add_include(){
			// New include URI
		const newUri=document.getElementById('lsc_new_include'),
			// ID of the new exclude
			id='lsc_include_'+Math.floor(Math.random()*Number.MAX_SAFE_INTEGER-0),
			// Existing
			existing=document.querySelector('#lsc_include_row input[type="hidden"][value="'+lsc_escape_id(newUri.value)+'"]');
			// New include template
			tmpl=existing?null:document.getElementById('lsc_include_template'),
			// New exclude
			newInclude=existing?null:tmpl.firstChild.cloneNode(true),
			// Insert before element
			before=existing?null:document.querySelector('#lsc_include_row .addNewInclude');
		if(existing){
			// Validate deleted existing include
			if(!document.querySelector('#'+lsc_escape_id(existing.getAttribute('name').substring(7))+'_span.deleted')){
				alert('Include exists already');
				return false;
			}
			lsc_undelete_include(existing.getAttribute('name').substring(7));
		}else{
			// Create a new include
			if(newUri.value.substring(0,1)=='/'){
				try{
					if(!/^\/.*\/[a-z]*$/.test(newUri.value)) throw new Error('Invalid syntax');
					new RegEx(newUri.value.replace(/^(\/.*\/)[a-z]*$/,"$1"),newUri.value.replace(/^\/.*\/([a-z]*)$/,"$1"));
				}catch(ex){
					alert('Invalid regular expression: '+ex.getMessage());
					return false;
				}
			}else if(!/^https?\:\/\/.+/i.test(newUri.value)){
				alert('Invalid URI');
				return false;
			}
			newInclude.setAttribute('id',id+'_span');
			before.parentNode.insertBefore(newInclude,before);
			const code=newInclude.childNodes[0],
				link=document.querySelector('#'+lsc_escape_id(id)+'_span a'),
				hidden=document.querySelector('#'+lsc_escape_id(id)+'_span input');
			code.innerText=newUri.value;
			link.setAttribute('href','javascript:lsc_delete_include("'+lsc_escape_id(id)+'");');
			hidden.setAttribute('name',id);
			hidden.setAttribute('value',newUri.value);
		}
		// Clear the form
		newUri.value='';
		return false;
	}
	function lsc_delete_include(id){
		// Delete an include
		const span=document.getElementById(id+'_span'),
			link=document.querySelector('#'+span.id+' a'),
			hidden=document.querySelector('#'+span.id+' input');
		span.className='deleted';
		link.innerText='Undelete';
		link.setAttribute('href','javascript:lsc_undelete_include("'+lsc_escape_id(id)+'");');
		hidden.setAttribute('name','delete_'+hidden.name);
	}
	function lsc_undelete_include(id){
		// Undelete an include
		const span=document.getElementById(id+'_span'),
			link=document.querySelector('#'+span.id+' a'),
			hidden=document.querySelector('#'+span.id+' input');
		span.className='';
		link.innerText='Delete';
		link.setAttribute('href','javascript:lsc_delete_include("'+lsc_escape_id(id)+'");');
		hidden.setAttribute('name',id);
	}
	function lsc_escape_id(id){
		// Escape an ID for JavaScript usage
		return id.replace(/[\\|\"|\']/g,'\\$&').replace(/\u0000/g,'\\0');
	}
}
</script>
</div>
<?php    	
	}
	add_action('admin_menu','lsc_admin',10,0);
	
	// Uninstallation
	function lsc_activate(){
		register_uninstall_hook(__FILE__,'lsc_uninstall');
	}
	function lsc_uninstall(){
		delete_option('lsc_autoversion_options');
		delete_option('lsc_exclude');
		delete_option('lsc_include');
	}
	register_activation_hook(__FILE__,'lsc_activate');
}

// Tools
function lsc_js_file(){
	// Get the LSC JavaScript filename
	return !!get_option('lsc_min',true)?'lsc.min.js':'lsc.js';
}
function lsc_js_uri(){
	// Get the LSC JavaScript URI
	return plugins_url(lsc_js_file(),__FILE__);
}
function lsc_match($uri,$rules){
	// Determine if an URI matches a ruleset (like it comes from excludes/includes)
	foreach($rules as $rule)
		if(substr($rule,0,1)=='/'){
			if(preg_match($rule,$uri)) return true;
		}else if(substr($uri,0,strlen($rule))==$rule){
			return true;
		}
	return false;
}
function &lsc_settings($defaults=false){
	// Get all LSC settings
	$res=Array(
		'lsc_cache_name'=>'',
		'lsc_version'=>0,
		'lsc_autoversion'=>false,
		'lsc_history'=>true,
		'lsc_prefetch'=>false,
		'lsc_position'=>true,
		'lsc_min'=>true,
		'lsc_token'=>'',
		'lsc_extensions'=>'',
		'lsc_quiet'=>false,
		'lsc_max'=>0,
		'lsc_limit'=>5,
		'lsc_autoversion_options'=>$defaults?null:lsc_autoversion_options(),
		'lsc_exclude'=>$defaults?null:lsc_exclude_uris(),
		'lsc_include'=>$defaults?null:lsc_include_uris()
	);
	if(!$defaults){
		foreach(array_keys($res) as $key)
			if(!is_array($res[$key])){
				$value=$res[$key];
				$res[$key]=get_option($key,null);
				if(is_null($res[$key])){
					trigger_error('Missing LSC option value for setting "'.$key.'"',E_USER_WARNING);
				}else if(is_int($value)&&!is_int($res[$key])){
					$res[$key]=intval($res[$key]);
				}else if(is_bool($value)&&!is_bool($res[$key])){
					$res[$key]=!!$res[$key];
				}else if(!is_string($res[$key])){
					trigger_error('Expected string LSC option value, but have to convert "'.$key.'"',E_USER_WARNING);
					$res[$key]=(string)$res[$key];
				}
			}
	}else{
		unset($res['lsc_autoversion_options']);
		unset($res['lsc_exclude']);
		unset($res['lsc_include']);
	}
	return $res;
}

endif;// End prevend double loading
