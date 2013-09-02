var updated=0,css=null,styles={};
// Message
opera.extension.addEventListener('message', function(event) {
	var message=event.data;
	if(message.topic=='LoadedStyle') loadStyle(message.data);
	else if(message.topic=='GetPopup') opera.extension.postMessage({
		topic:'GotPopup',
		data:{
			styles:Object.getOwnPropertyNames(styles),
			astyles:Object.getOwnPropertyNames(astyles),
			cstyle:cur
		}
	}); else if(message.topic=='AlterStyle') alterStyle(message.data);
	else if(message.topic=='CheckedStyle') {
		if(message.data) {
			if(!message.data.updated||message.data.updated<updated) window.fireCustomEvent('styleCanBeUpdated');
			else window.fireCustomEvent('styleAlreadyInstalledOpera');
		} else window.fireCustomEvent('styleCanBeInstalledOpera');
	} else if(message.topic=='ParsedCSS') {
		if(window.fireCustomEvent) {
			if(message.data.status<0) alert(message.data.message);
			else window.fireCustomEvent('styleInstalled');
		} else showMessage(message.data.message);
	} else if(message.topic=='ConfirmInstall') {
		if(message.data&&confirm(message.data)) {
			if(installCallback) installCallback();
			else {
				var t='ParseFirefoxCSS';
				if(/\.json$/.test(window.location.href)) t='ParseJSON';
				opera.extension.postMessage({topic:t,data:{code:document.body.innerText}});
			}
		}
	}
}, false);
opera.extension.postMessage({topic:'LoadStyle'});
function showMessage(data){
	var d=document.createElement('div');
	d.style='position:fixed;border-radius:5px;background:orange;padding:20px;z-index:9999;box-shadow:5px 10px 15px rgba(0,0,0,0.4);transition:opacity 1s linear;opacity:0;text-align:left;';
	document.body.appendChild(d);d.innerHTML=data;
	d.style.top=(window.innerHeight-d.offsetHeight)/2+'px';
	d.style.left=(window.innerWidth-d.offsetWidth)/2+'px';
	function close(){document.body.removeChild(d);delete d;}
	d.onclick=close;	// close immediately
	setTimeout(function(){d.style.opacity=1;},1);	// fade in
	setTimeout(function(){d.style.opacity=0;setTimeout(close,1000);},3000);	// fade out
}

// CSS applying
function loadStyle(data) {
	if(data.styles) for(var i in data.styles)
		if(typeof data.styles[i]=='string') styles[i]=data.styles[i]; else delete styles[i];
	if(data.isApplied) {
		if(!css) {
			css=document.createElement('style');
			css.setAttribute('type', 'text/css');
			document.documentElement.appendChild(css);
		}
		if(styles) {
			var i,c=[];
			for(i in styles) c.push(styles[i]);
			css.innerHTML=c.join('');
		}
	} else if(css) {document.documentElement.removeChild(css);css=null;}
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
	req.onloadend=function(){
		if(this.status==200) try{updated=getTime(JSON.parse(req.responseText));} catch(e) {}
		opera.extension.postMessage({topic:'CheckStyle',data:id});
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
		if(installCallback.ping){
			var req=new window.XMLHttpRequest();
			req.open('GET', getData('stylish-install-ping-url-opera'), true);
			req.send();
		}
	};
	function install(e){installCallback.ping=true;opera.extension.postMessage({topic:'InstallStyle'});}
	function update(e){installCallback.ping=false;window.stylishInstallOpera(e);}
	window.addCustomEventListener('stylishInstallOpera',install);
	window.addCustomEventListener('stylishUpdate',update);
}
var installCallback=null;
if(/\.user\.css$|\.json$/.test(window.location.href)) (function(){
	function install(){
		if(document&&document.body&&!document.querySelector('title')) opera.extension.postMessage({topic:'InstallStyle'});
	}
	if(document.readyState!='complete') window.addEventListener('load',install,false);
	else install();
})(); else if(/^http:\/\/userstyles\.org\/styles\//.test(window.location.href))
	window.addEventListener('DOMNodeInserted',fixOpera,false);
