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
		if(!chdir('../')){
			trigger_error('Failed to include wp-load.php',E_USER_WARNING);
			exit;
		}
	require_once 'wp-load.php';
	// Validate the action parameter
	if(!isset($_REQUEST['lsc_action'])||$_REQUEST['lsc_action']==''){
		trigger_error('LSC webservice call without action parameter',E_USER_NOTICE);
		exit;
	}
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
		){
		trigger_error('LSC webservice call without valid token',E_USER_WARNING);
		exit;
	}
	// Perform actions with token
	switch($_REQUEST['lsc_action']){
		case 'increaseversion':
			// Increase and display the LSC cache version number
			update_option('lsc_version',$version=intval(get_option('lsc_version',0))+1);
			echo $version;
			exit;
		default:
			trigger_error('Invalid/unknown action "'.$_REQUEST['lsc_action'].'"',E_USER_WARNING);
			exit;
	}
	exit;
}

// Get the automatic versioning options
function &lsc_autoversion_options(){
	$options=get_option('lsc_autoversion__options',null);
	if(!$options) $options=Array(
		'wp_insert_post'=>'On post insert/update',
		'comment_post'=>'On post comment'
	);
	return $options;
}

// Add the JavaScript to the page
function lsc_js_enqueue($force=false){
	if(is_admin()||(!$force&&!get_option('lsc_load',true))) return;
	$js=__DIR__.(!!get_option('lsc_min',true)?'/lsc.min.js':'/lsc.js');
	wp_enqueue_script('LSC',substr($js,strlen(ABSPATH)),Array(),(string)filemtime($js),!get_option('lsc_position',true));
}
function lsc_js($force=false){
	if(is_admin()||(!$force&&!get_option('lsc_load',true))) return;
	$name=get_option('lsc_cache_name',null);
	$version=intval(get_option('lsc_version',0));
	$preFetch=!!get_option('lsc_prefetch',false);
	$history=!!get_option('lsc_history',true);
	$extensions=explode(',',get_option('lsc_extensions',''));
	?><script>
if(!LSC.instance){
<?php
	if(!$history):
		?>	LSC.options.history=false;
<?php
	endif;
	if(count($extensions)):
		?>	LSC.extensions.push(...<?php echo json_encode($extensions); ?>);
<?php
	endif;
	?>	window.addEventListener(
		'load',
		async ()=>await LSC(
			<?php echo $name==''?'null':'"'.preg_quote($name).'"'; ?>,
			<?php echo $version; ?>,
			<?php echo $preFetch?'true':'false'; ?>
			)
		);
}
</script>
<?php
}
if(!is_admin()&&!!get_option('lsc_load',true)){
	add_action('wp_enqueue_script','lsc_js_enqueue',2147483646,0);
	add_action(!!get_option('lsc_position',true)?'wp_head':'wp_footer','lsc_js',2147483646,0);
}

// Automatic site version increase
function lsc_autoversion(){
	if(defined('LSC_VERSION_AUTOUPDATE')) return;
	update_option('lsc_version',$version=intval(get_option('lsc_version',0))+1);
	define('LSC_VERSION_AUTOUPDATE',$version);
}
foreach(array_keys(lsc_autoversion_options()) as $hook)
	if(!!get_option('lsc_autoversion_'.$hook,true))
		add_action($hook,'lsc_autoversion',10,0);

// Administration extensions
if(is_admin()&&current_user_can('administrator')){
	
	// Initialization
	function lsc_admin_init(){
		if(!is_admin()||!current_user_can('administrator')) return;
		// Register options
		$defaults=Array(
			'lsc_cache_name'=>'',
			'lsc_version'=>0,
			'lsc_autoversion'=>false,
			'lsc_autoversion__options'=>null,
			'lsc_history'=>true,
			'lsc_prefetch'=>false,
			'lsc_position'=>true,
			'lsc_min'=>true,
			'lsc_token'=>'',
			'lsc_extensions'=>''
		);
		foreach($defaults as $option=>$def){
			register_setting('lsc',$option);
			if(is_null(get_option($option,null)))
				add_option($option,$def);
		}
		// Parse parameters
		$param=Array();
		foreach($_REQUEST as $key=>$value)
			if(preg_match('/^page|settings-updated|(delete_)lsc_autoversion__.+$/',$key))
				$param[$key]=strip_tags((string)wp_unslash($value));
		// Return, if settings wheren't updated
		if(!isset($param['page'])||$param['page']!='lsc_config'||!isset($param['settings-updated'])){
			foreach(array_keys(lsc_autoversion_options()) as $option) register_setting('lsc','lsc_autoversion_'.$option);
			return;
		}
		// Store settings
		$options=Array();
		$cnt=0;
		foreach($param as $key=>$value){
			// Skip other parameters
			if(!preg_match('/^(delete_)?lsc_autoversion__[a-z|0-9]+(_[a-z|0-9]+)+$/',$key)) continue;
			// Get the hook name and the option ID
			$option=substr(preg_replace('/^(delete_)?lsc_autoversion__([a-z|0-9]+(_[a-z|0-9]+)+)$/',"$2",$key),0,64);
			$id='lsc_autoversion_'.$option;
			if(substr($key,0,7)=='delete_'){
				// Delete a hook
				delete_option($id);
				continue;
			}
			// Skip incomplete/other parameters
			if(!isset($param[$key.'__info'])||substr($key,0,17)!='lsc_autoversion__') continue;
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
		update_option('lsc_autoversion__options',$options);
	}
	add_action('admin_init','lsc_admin_init',10,0);
	
	// Configuration menu option
	function lsc_admin(){
		if(!is_admin()||!current_user_can('administrator')) return;
		add_options_page('Configuration','LSC','manage_options','lsc_config','lsc_config');
	}
	function lsc_config(){
		if(!is_admin()||!current_user_can('administrator')) return;
		?><style type="text/css">
#lsc_options_form span.deleted label{
	text-decoration:line-through;
}
</style>
<div class="wrap">
<h1>LCS</h1>
<form action="options.php" method="post">
<?php
		settings_fields('lsc');
?><h2>Configuration</h2>
<p>Disable automatic LSC loading, if you plan to load the JavaScript and integrate the required HTML by yourself (in your DIY theme, f.e.).</p>
<p>If you won't provide a cache name, LSC will use the domain of your website. If you leave the site version &lt;1, LSC will use the current date and time, which will cache the current session, but renew the cache on the next page visit or reload.</p>
<p>If the browser history is managed by LSC, the browser will display changed URIs, but the document object won't change, which will cause no DOM objects being raised during load/unload.<br />
If the browser history is unmanaged, the browsers URI will stay the initial URI while other pages are being displayed, but a new document object will be used for every page, which will raise load/unload DOM events.</p>
<p>Per default the URI file extensions <strong>html</strong>, <strong>htm</strong> and <strong>php</strong> are managed. You may add a comma separated list of additional extensions as required.</p>
<div id="lsc_autoversion_template" hidden="hidden">
<span id="lsc_autoversion_template_span" class="wpHook">&nbsp;&nbsp;&nbsp;&nbsp;<label for="lsc_autoversion_template_input"><input type="checkbox" name="lsc_autoversion_template_input" id="lsc_autoversion_template_input" value="1" checked="checked" /></label> <a href="">Delete</a><br /><input type="hidden" name="lsc_autoversion_template_info" value="" /></span>
</div>
<table class="form-table" id="lsc_options_form">
<tr valign="top">
<th scope="row">Load LSC</th>
<td><label for="lsc_load"><input type="checkbox" name="lsc_load" id="lsc_load" value="1" <?php echo get_option('lsc_load',true)?'checked="checked"':''; ?> /> Automatic load LSC</label></td>
</tr>
<tr valign="top">
<th scope="row"><label for="lsc_cache_name">Cache name</label></th>
<td><input type="text" name="lsc_cache_name" maxlength="64" id="lsc_cache_name" pattern="[a-z|A-Z|0-9|\-|\.|_]*" value="<?php echo esc_attr(get_option('lsc_cache_name','')); ?>" size="40" class="regular-text" /></td>
</tr>
<tr valign="top">
<th scope="row"><label for="lsc_version">Site version</label></th>
<td><input type="number" min="0" name="lsc_version" id="lsc_version" value="<?php echo esc_attr(get_option('lsc_version','0')); ?>" size="20" class="regular-text" /></td>
</tr>
<tr valign="top" id="lsc_autoversion_row">
<th scope="row">Automatic version</th>
<td><label for="lsc_autoversion"><input type="checkbox" name="lsc_autoversion" id="lsc_autoversion" value="1" <?php echo get_option('lsc_autoversion',false)?'checked="checked"':''; ?> /> Automatic site version number increase</label><br />
<?php
		foreach(lsc_autoversion_options() as $option=>$info){
			$attr=esc_attr('lsc_autoversion__'.$option);
			?><span id="<?php echo $attr; ?>_span" class="wpHook">&nbsp;&nbsp;&nbsp;&nbsp;<label for="<?php echo $attr; ?>"><input type="checkbox" name="<?php echo $attr; ?>" id="<?php echo $attr; ?>" value="1" <?php echo get_option('lsc_autoversion_'.$option,true)?'checked="checked"':''; ?> /> <?php echo esc_html($info); ?></label> <a href="javascript:lsc_delete_option('<?php echo preg_quote('lsc_autoversion__'.$option); ?>');">Delete</a><br /><input type="hidden" name="<?php echo $attr.'__info'; ?>" value="<?php echo esc_attr($info); ?>"></span>
<?php
		}
		?>
<h3>Add new hook</h3>
<p><label for="lsc_new_hook">WordPress hook name:<br />
<input type="text" max="64" name="lsc_new_hook" id="lsc_new_hook" size="40" class="regular-text" /></label><br />
<label for="lsc_new_info">Information:<br />
<input type="text" max="256" name="lsc_new_info" id="lsc_new_info" size="40" class="regular-text" /></label><br />
<button onclick="lsc_add_option();">Add hook</button></p>
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
<th scope="row">JavaScript position</th>
<td><label for="lsc_position"><input type="checkbox" name="lsc_position" id="lsc_position" value="1" <?php echo get_option('lsc_position',true)?'checked="checked"':''; ?> /> Load LSC in the HTML header</label></td>
</tr>
<tr valign="top">
<th scope="row">Session storage</th>
<td><label for="lsc_usess"><input type="checkbox" name="lsc_usess" id="lsc_usess" value="1" <?php echo get_option('lsc_usess',false)?'checked="checked"':''; ?> /> Use the <strong>sessionStorage</strong> instead of the <strong>localStorage</strong></label></td>
</tr>
<tr valign="top">
<th scope="row">Minified</th>
<td><label for="lsc_min"><input type="checkbox" name="lsc_min" id="lsc_min" value="1" <?php echo get_option('lsc_min',true)?'checked="checked"':''; ?> /> Use the minified JavaScript</label></td>
</tr>
<tr valign="top">
<th scope="row"><label for="lsc_token">Webservice token</label></th>
<td><input type="text" name="lsc_token" maxlength="256" id="lsc_token" value="<?php echo esc_attr(get_option('lsc_token','')); ?>" size="40" class="regular-text" /></td>
</tr>
<tr valign="top">
<th scope="row"><label for="lsc_extensions">Managed extensions</label></th>
<td><input type="text" name="lsc_extensions" maxlength="256" id="lsc_extensions" value="<?php echo esc_attr(get_option('lsc_extensions','')); ?>" size="40" class="regular-text" /></td>
</tr>
</table>
<?php
		submit_button();
?>
</form>
<script type="text/javascript">
if(typeof window.lsc_add_option=='undefined'){
	function lsc_add_option(){
			// ID of the new option
		const id='lsc_autoversion__'+newHook.value,
			// Existing option
			existing=document.querySelector('#'+id+'_span'),
			// New option template
			tmpl=existing?null:document.getElementById('lsc_autoversion_template'),
			// New option
			newOption=existing?null:tmpl.firstChild.cloneNode(true),
			// Last option
			last=existing?null:document.querySelector('#lsc_autoversion_row span.wpHook:last-child'),
			// Options cell
			cell=existing?null:last?.parentNode??document.querySelector('#lsc_autoversion_row>td:last-child'),
			// New hook name
			newHook=document.getElementById('lsc_new_hook'),
			// New hook info
			newInfo=document.getElementById('lsc_new_info');
		// Validate the hook name
		if(!existing&&!/^[a-z|0-9]+(_[a-z|0-9]+)+$/.test(newHook.value)){
			alert('Invalid WordPress hook name');
			return;
		}
		// Validate the hook info
		if(newInfo.value.length<1){
			alert('Option information required');
			return;
		}
		// Handle an existing option
		if(existing){
			// Validate existing not deleted option
			if(!document.getElementById('delete_'+id)){
				alert('WordPress hook defined already');
				return;
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
			return;
		}
		// Create a new option
		newOption.setAttribute('id',id+'_span');
		if(last){
			cell.insertChild(newOption,last);
		}else{
			cell.appendChild(newOption);
		}
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
		check.setAttribute('name',id);
		check.setAttribute('id',id);
		hidden.setAttribute('name',id+'__info');
		hidden.setAttribute('value',newInfo.value);
		label.appendChild(text);
		link.setAttribute('href','javascript:lsc_delete_option("'+lsc_escape_id(id)+'");');
		// Clear the form
		newHook.value='';
		newInfo.value='';
	}
	function lsc_delete_option(id){
		// Delete an option
		document.getElementById(id+'_span').className='deleted';
		const check=document.getElementById(id);
		check.setAttribute('id','delete_'+id);
		check.setAttribute('readonly','readonly');
		const link=document.querySelector('#'+id+'_span a');
		link.innerText='Undelete';
		link.setAttribute('href','javascript:lsc_undelete_option("'+lsc_escape_id(id)+'");');
	}
	function lsc_undelete_option(id){
		// Undelete an option
		document.getElementById(id+'_span').className='';
		const check=document.getElementById(id);
		check.setAttribute('id',id);
		check.removeAttribute('readonly');
		const link=document.querySelector('#'+id+'_span a');
		link.innerText='Delete';
		link.setAttribute('href','javascript:lsc_delete_option("'+lsc_escape_id(id)+'");');
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
	
}

endif;// End prevend double loading
