var updated=0,style=null,css={};
function getKeys(d){var k=[];for(i in d) k.push(i);return k;}
// Message
opera.extension.addEventListener('message', function(event) {
	var message=event.data;
	if(message.topic=='LoadedStyle') onCSS(message.data);
	else if(message.topic=='UpdateStyle') updateStyle(message.data);
	else if(message.topic=='GetPopup') opera.extension.postMessage({
		topic:'GotPopup',
		data:{
			styles:getKeys(css),
			astyles:getKeys(astyles),
			cstyle:cur
		}
	}); else if(message.topic=='AlterStyle') alterStyle(message.data);
	else if(message.topic=='LoadStyle') opera.extension.postMessage({topic:'LoadStyle'});
	else if(message.topic=='CheckedStyle') {
		if(message.data) {
			if(!message.data.updated||message.data.updated<updated) window.fireCustomEvent('styleCanBeUpdated');
			else window.fireCustomEvent('styleAlreadyInstalledOpera');
		} else window.fireCustomEvent('styleCanBeInstalledOpera');
	} else if(message.topic=='ParsedCSS') {
		if(!message.data.error) window.fireCustomEvent('styleInstalled');
		else alert(message.data.message);
	} else if(message.topic=='ConfirmInstall') {
		if(message.data&&confirm(message.data)) {
			if(installCallback) installCallback();
			else opera.extension.postMessage({topic:'ParseFirefoxCSS',data:{code:document.body.innerText}});
		}
	}
}, false);
opera.extension.postMessage({topic:'LoadStyle'});

// CSS applying
function loadStyle(){
	if(style&&css) {
		var i,c=[];
		for(i in css) c.push(css[i]);
		style.innerHTML=c.join('');
	}
}
function updateStyle(data) {
	for(var i in data)
		if(typeof data[i]=='string') css[i]=data[i]; else delete css[i];
	loadStyle();
}
function onCSS(data) {
	if(data.data) css=data.data;
	if(data.isApplied) {
		if(!style) {
			style = document.createElement('style');
			style.setAttribute('type', 'text/css');
			document.head.appendChild(style);
		}
		loadStyle();
	} else if(style) {
		document.head.removeChild(style);
		style=null;
	}
}

// Alternative style sheets
var astyles={},cur=undefined;
function addStylesheet(i){
	var c=astyles[i.title];
	if(!c) astyles[i.title]=c=[];
	c.push(i);
	if(cur==undefined) cur=i.title;
}
function alterStyle(s){
	for(var i in astyles) astyles[i].forEach(function(l){l.disabled=i!=s;});cur=s;
}
window.addEventListener('DOMContentLoaded',function(){
	Array.prototype.forEach.call(document.querySelectorAll('link[rel=stylesheet][title]'),addStylesheet);
	Array.prototype.forEach.call(document.querySelectorAll('link[rel="alternate stylesheet"][title]'),addStylesheet);
},false);

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
			opera.extension.postMessage({topic:'CheckStyle',data:id});
		}
	};
	req.send();

	installCallback=function(){
		opera.extension.postMessage({
			topic:'InstallStyle',
			data:{
				id:id,
				metaUrl:metaUrl,
				updated:updated,
				url:getData('stylish-code-opera'),
			}
		});
	};
	installCallback.ping=true;
	function install(e){
		opera.extension.postMessage({topic:'InstallStyle'});
		if(installCallback.ping){
			var req=new window.XMLHttpRequest();
			req.open('GET', getData('stylish-install-ping-url-opera'), true);
			req.send();
		}
	}
	function update(e){
		installCallback.ping=false;
		window.fireCustomEvent('stylishInstall');
	}
	window.addCustomEventListener('stylishInstallOpera',install);
	window.addCustomEventListener('stylishUpdate',update);
}
var installCallback=null;
if(/\.user\.css$/.test(window.location.href)) (function(){
	function install(){
		if(document&&document.body&&!document.querySelector('title')) opera.extension.postMessage({topic:'InstallStyle'});
	}
	if(document.readyState!='complete') window.addEventListener('load',install,false);
	else  install();
})(); else if(/^http:\/\/userstyles\.org\/styles\//.test(window.location.href))
	window.addEventListener('DOMNodeInserted',fixOpera,false);
