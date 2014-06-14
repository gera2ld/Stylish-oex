var location=window.location;
// Message
function fireEvent(t){
	var e=document.createEvent('Events');
	e.initEvent(t,false,false);
	document.dispatchEvent(e);
}
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
			if(!message.data.updated||message.data.updated<data.updated) fireEvent('styleCanBeUpdatedOpera');
			else fireEvent('styleAlreadyInstalledOpera');
			data.id=message.data.id;
		} else fireEvent('styleCanBeInstalledOpera');
	} else if(message.topic=='ParsedCSS') {
		if(data) {
			if(message.data.status<0) alert(message.data.message);
			else fireEvent('styleInstalled');
		} else showMessage(message.data.message);
	} else if(message.topic=='ConfirmInstall') {
		if(message.data&&confirm(message.data)) {
			if(data) {
				opera.extension.postMessage({topic:'InstallStyle',data:data});
				if(ping) ping();
			} else {
				var t='ParseFirefoxCSS';
				if(/\.json$/.test(location.href)) t='ParseJSON';
				opera.extension.postMessage({topic:t,data:{code:document.body.innerText}});
			}
		}
	}
}, false);
opera.extension.postMessage({topic:'LoadStyle'});
function addScript(url){
	var s=document.createElement('script');s.src=url;
	document.body.appendChild(s);
	document.body.removeChild(s);
}

// CSS applying
var css=null,styles={};
function loadStyle(data) {
	var i,c;
	if(data.styles) for(i in data.styles) {
		c=data.styles[i];
		if(c==null) delete styles[i];		// deleted
		else if(c==false) {
			if(i in styles) styles[i]='';		// disabled
		} else if(typeof c=='string') styles[i]=c;
	}
	if(data.isApplied) {
		if(!css) {
			css=document.createElement('style');
			css.setAttribute('type', 'text/css');
			document.documentElement.appendChild(css);
		}
		if(styles) {
			c=[];
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
var data=null,ping=null;
function getData(k){
	var s=document.querySelector('link[rel='+k+']');
	if(s) return s.getAttribute('href');
}
function fixOpera(){
	var url=getData('stylish-id-url'),metaUrl=url+'.json',req=new window.XMLHttpRequest();
	req.open('GET', metaUrl, true);
	req.onloadend=function(){
		if(this.status==200) try{
			data.updated=new Date(JSON.parse(req.responseText).updated).getTime();
		} catch(e) {}
		opera.extension.postMessage({topic:'CheckStyle',data:url});
	};
	req.send();

	data={
		url:url,
		metaUrl:metaUrl,
	};
	function update(){
		data.updateUrl=getData('stylish-code-opera');
		opera.extension.postMessage({topic:'InstallStyle'});
	}
	function install(){
		ping=function(){addScript(getData('stylish-install-ping-url-opera'));};
		update();
	}
	document.addEventListener('stylishInstallOpera',install);
	document.addEventListener('stylishUpdateOpera',update);
}
if(/\.user\.css$|\.json$/.test(location.href)) {
	function rawInstall(){
		if(document&&document.body&&!document.querySelector('title')) opera.extension.postMessage({topic:'InstallStyle'});
	}
	if(document.readyState!='complete') window.addEventListener('load',rawInstall,false);
	else rawInstall();
} else if(location.host=='userstyles.org'&&location.pathname.substr(0,8)=='/styles/')
	window.addEventListener('DOMContentLoaded',fixOpera,false);
