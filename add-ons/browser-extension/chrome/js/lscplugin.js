if(LSC.instance){
	// Don't disturb
	console.log('LSC plugin will not override a running LSC',LSC);
}else if(
		document.contentType.toLowerCase().substring(0,9)!='text/html'&&
		document.contentType.toLowerCase().substring(0,21)!='application/xhtml+xml'
	){
	// Don't manage
	console.log('LSC plugin will not manage an unknown content type',document.contentType);
}else{
	// Handle plugin messages
	api.runtime.onMessage.addListener(async (message,sender,respond)=>{
			// Plugin message
		switch(message.type){
			case 'manage':
				console.debug('LSC plugin management message',message,sender);
				// Set settings
				if(LSC.instance){
					// LSC running already
					console.debug('Update running LSC instance');
					await LSC.instance.setSessionStorage(message.session);
				}else{
					// Initialize LSC
					console.debug('Initialize LSC for the website');
					LSC.options.isPlugin=true;
					LSC.options.useSessionStorage=message.session;
					await LSC(null,0,message.options.prefetch);
				}
				break;
			case 'status':
				// Determine the current status
				var status='inactive';
				if(LSC.instance&&LSC.options.enable)
					status=LSC.instance.getFetchCount()?'loading':'active';
				respond(status);
				return true;
			default:
				console.warn('Invalid LSC plugin message',message.type);
				break;
		}
	});
}
