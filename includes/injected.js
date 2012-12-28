(function() {
var css=null,updated=0,style=null;
// Message
opera.extension.addEventListener('message', function(event) {
	var message=event.data;
	if(message.topic=='ToggleCSS') onCSS(message.data);
	else if(message.topic=='LoadCSS') opera.extension.postMessage({topic:'LoadCSS'});
	else if (message.topic=='CheckedCSS'){
		if(css=message.data) {
			if(!css.updated||css.updated<updated) window.fireCustomEvent('styleCanBeUpdated');
			else window.fireCustomEvent('styleInstalled');
		} else window.fireCustomEvent('styleCanBeInstalled');
	} else if(message.topic=='ParsedCSS'){
		if(message.data) {
			if(window.fireCustomEvent) window.fireCustomEvent('styleInstalled');
			alert('UserStyle: <'+message.data.name+'> is '+(message.isNew?'added':'updated')+'!\nCheck it out in the options page.');
		} else alert('Install failed: Bad CSS code!');
	}
}, false);
opera.extension.postMessage({topic:'LoadCSS'});

// CSS applying
function onCSS(data) {
	if(data.isApplied) {
		if(!style) {
			style = document.createElement('style');
			style.setAttribute('type', 'text/css');
			document.head.appendChild(style);
		}
		style.innerHTML=data.css;
	} else if(style) {
		document.head.removeChild(style);
		style=null;
	}
}

// Stylish fix
function getTime(r){
	var d=new Date(),z,m=r.updated.match(/(\d+)\/(\d+)\/(\d+)\s+(\d+):(\d+):(\d+)\s+(\+|-)(\d+)/);
	d.setUTCFullYear(parseInt(m[1],10));
	d.setUTCMonth(parseInt(m[2],10)-1);
	d.setUTCDate(parseInt(m[3],10));
	d.setUTCHours(parseInt(m[4],10));
	d.setUTCMinutes(parseInt(m[5],10));
	d.setUTCSeconds(parseInt(m[6],10));
	d.setUTCMilliseconds(0);
	d=d.getTime()/1000;
	z=parseInt(m[8].substr(0,2),10)*60+parseInt(m[8].substr(2),10);z*=60;
	if(m[7]!='-') z=-z;d+=z;
	return d;
}
function fixOpera(){
	if(!window.switchBrowser) return setTimeout(fixOpera,500);
	var _switchBrowser=window.switchBrowser,id=window.getId(),options=window.getOptions(true);
	window.switchBrowser=function(select){
		if(select.value=='opera') window.switchToPanel(window.stylishActivatedPanel);
		else return _switchBrowser(select);
	};
	var req = new window.XMLHttpRequest();
	req.open('GET', '/styles/'+id+'.json', true);
	req.onreadystatechange=function(){
		if(req.readyState==4) {
			try{
				updated=getTime(JSON.parse(req.responseText));
			} catch(e) {
				alert('Oops! Failed checking for update!');updated=0;
			}
			opera.extension.postMessage({topic:'CheckCSS',data:id});
		}
	};
	req.send();

	function install(e){
		var data={
			id:id,
			options:options&&1,
			updated:updated,
			code:window.$('stylish-code').innerText
		};
		if(!css) data.name=window.$('stylish-description').innerText;
		opera.extension.postMessage({topic:'ParseCSS',data:data});
	}
	window.addCustomEventListener('stylishInstall',install);
	window.addCustomEventListener('stylishUpdate',install);
}
if(/\.user\.css$/.test(window.location.href)) {
	if(eval(widget.preferences.getItem('installFile'))) {
		var c=confirm('Do you want to install this UserCSS?');
		if(c) opera.extension.postMessage({topic:'ParseCSS',data:{code:document.body.innerText}});
	}
} else if(/^http:\/\/userstyles\.org\/styles\//.test(window.location.href)) fixOpera();
})();
