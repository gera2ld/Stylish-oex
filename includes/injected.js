var updated=0,style=null;
// Message
opera.extension.addEventListener('message', function(event) {
	var message=event.data;
	if(message.topic=='LoadedCSS') onCSS(message.data);
	else if(message.topic=='LoadCSS') opera.extension.postMessage({topic:'LoadCSS'});
	else if(message.topic=='CheckedCSS') {
		if(message.data) {
			if(!message.data.updated||message.data.updated<updated) window.fireCustomEvent('styleCanBeUpdated');
			else window.fireCustomEvent('styleAlreadyInstalledOpera');
		} else
			window.fireCustomEvent('styleCanBeInstalledOpera');
	} else if(message.topic=='ParsedCSS') {
		alert(message.data.message);
		if(!message.data.error) window.fireCustomEvent('styleInstalled');
	} else if(message.topic=='Confirm') {
		if(message.data&&confirm(message.data))
			opera.extension.postMessage({topic:'ParseFirefoxCSS',data:{code:document.body.innerText}});
	} else {
		c=callbacks[message.topic];
		if(c) {c(message.data);delete callbacks[message.topic];}
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
	if(!window.addCustomEventListener) return;
	window.removeEventListener('DOMNodeInserted',fixOpera,false);

	function getData(k){
		var s=document.querySelector('link[rel='+k+']');
		if(s) return s.getAttribute('href');
	}
	var id=getData('stylish-id-url'),metaUrl=id+'.json';
	var req = new window.XMLHttpRequest();
	req.open('GET', metaUrl, true);
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
			metaUrl:metaUrl,
			options:window.getOptions(),
			updated:updated,
			//url:getData('stylish-code-opera'),
			url:getData('stylish-code-chrome'),
		};
		opera.extension.postMessage({topic:'ParseCSSURL',data:data});
		if(e.type=='stylishInstallOpera') {
			var req=new window.XMLHttpRequest();
			req.open('GET', getData('stylish-install-ping-url-opera'), true);
			req.send();
		}
	}
	window.addCustomEventListener('stylishInstallOpera',install);
	window.addCustomEventListener('stylishUpdate',install);
}
if(/\.user\.css$/.test(window.location.href))
	opera.extension.postMessage({topic:'InstallCSS'});
else if(/^http:\/\/userstyles\.org\/styles\//.test(window.location.href))
	window.addEventListener('DOMNodeInserted',fixOpera,false);
