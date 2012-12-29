function getSetting(key,def){
	try{return JSON.parse(widget.preferences.getItem(key)||'');}catch(e){return saveSetting(key,def);}
}
function saveSetting(key,val){widget.preferences.setItem(key,JSON.stringify(val));return val;}

var css=getSetting('cssList',[]),map={};
css.forEach(function(i){if(i.id) map[i.id]=i; else i.id=getId(map,i);});

/* ================Data format 0.2=================
 * List	[
 * 	Item	{
 * 		name:	String(stylish-description)
 * 		url:	String		// Homepage
 * 		id:	url||random
 * 		metaUrl:	String	// for update checking
 * 		updateUrl:	String	// for update
 * 		updated:	Int
 * 		enabled:	Boolean
 * 		deprefix:	List	['-moz-','-webkit-']
 * 		data:	List	[
 * 					{
 * 					domains:	List	[...]
 * 					regexps:	List	[...]
 * 					urlPrefixes:	List	[...]
 * 					urls:		List	[...]
 * 					code:		String
 * 					}
 * 				]
 * 		}
 * 	]
 */
(function(){	// Upgrading data to new version
	// Upgrade to version 0.1
	if(css[0]&&css[0].css!=undefined) {
		for(var i=0;i<css.length;i++){
			var x=css[i];
			css[i]={
				name:x.name,
				enabled:1,
				data:[{inc:x.includes,css:x.css}]
			};
			css[i].id=getId(map,css[i]);
		}
	}
	// Upgrade to version 0.2
	if(getSetting('version_storage',0)<0.2) {
		css.forEach(function(i){
			var d=i.data;
			i.data=[];
			if(parseInt(i.id)>1) {
				i.url='http://userstyles.org/styles/'+i.id;
				i.metaUrl='http://userstyles.org/styles/'+i.id+'.json';
			}
			i.deprefix=i.deprefix||[];
			i.updateUrl=i.url&&!i.options;
			delete i.options;
			d.forEach(function(d){
				var r={
					domains:[],
					regexps:[],
					urlPrefixes:[],
					urls:[],
					code:d.css
				};
				d.inc.forEach(function(i){
					if(m=i.match(/^([^\*]*)\*$/)) r.urlPrefixes.push(m[1]);
					else if(m=i.match(/^\*([^\/\?\*]+)\/\*$/)) r.domains.push(m[1].replace(/\\\./g,'.'));
					else if(m=i.match(/^\/(.*?)\/$/)) r.regexps.push(m[1]);
					else if(m=i.match(/^\/\^([^\*]+)\$\/$/)) r.urls.push(m[1].replace(/\\([\.\?])/g,'$1'));
					else r.urls.push(i);
				});
				i.data.push(r);
			});
		});
		saveCSS();
		saveSetting('version_storage',0.2);
	}
})();

function getId(map,d){	// get random ID (0<id<1)
	do{var s=Math.random();}while(map[s]);
	map[s]=d;
	return s;
}
function saveCSS(){saveSetting('cssList',css);}
function newCSS(c,save){
	var r={
		name:c?c.name:'New CSS',
		id:c&&c.id,
		metaUrl:c&&c.metaUrl,
		updated:c?c.updated:null,
		enabled:c?c.enabled:1,
		deprefix:c&&c.deprefix||[],
		data:[]
	};
	if(r.id) map[r.id]=r; else r.id=getId(map,r);
	css.push(r);
	if(save) saveCSS();
	return r;
}
function removeCSS(i){i=css.splice(i,1)[0];delete map[i.id];saveCSS();return i;}

function str2RE(s){return s.replace(/(\.|\?|\/)/g,'\\$1').replace(/\*/g,'.*?');}
function testURL(url,e,c){
	function testDomain(){
		r=d.domains;
		for(i=0;i<r.length;i++) if(RegExp('://(|[^/]*\\.)'+r[i].replace(/\./g,'\\.')+'/').test(url)) return true;
		return false;
	}
	function testRegexp(){
		r=d.regexps;
		for(i=0;i<r.length;i++) if(RegExp(r[i]).test(url)) return true;
		return false;
	}
	function testUrlPrefix(){
		r=d.urlPrefixes;
		for(i=0;i<r.length;i++) if(url.substr(0,r[i].length)==r[i]) return true;
		return false;
	}
	function testUrl(){
		r=d.urls;
		for(i=0;i<r.length;i++) if(r[i]==url) return true;
		return false;
	}
	var k,f,d,F=false,i,r;
	for(k=0;k<e.data.length;k++){
		d=e.data[k];
		f=testDomain()||testRegexp()||testUrlPrefix()||testUrl();
		if(c) {if(e.enabled&&f) c.push(d.code);}
		else if(F=F||f) return true;
	}
	return F;
}
function loadCSS(e) {
	var c=[];
	if(isApplied) css.forEach(function(i){testURL(e.origin,i,c);});
	e.source.postMessage({
		topic: 'LoadedCSS',
		data: {
			isApplied: isApplied,
			css:c.join('\n')
		}
	});
}
function checkCSS(e,d){e.source.postMessage({topic:'CheckedCSS',data:map[d]});}
function parseFirefoxCSS(e,d){
	var c=null,i,p,m={},r,code=d.code.replace(/\s+$/,''),data=[];
	code.replace(/\/\*\s+@(\w+)\s+(.*?)\s+\*\//g,function(v,g1,g2){m[g1]=g2;});
	for(i in m) if(!d[i]) d[i]=m[i];
	while(code){
		i=code.indexOf('@-moz-document');if(i<0) break;
		p=code.indexOf('{',i);
		m=code.slice(i,p);r={domains:[],regexps:[],urlPrefixes:[],urls:[]};
		m.replace(/([\w-]+)\(('|")?(.*?)\2\)/g,function(v,g1,g2,g3){
			try{g3=JSON.parse('"'+g3+'"');}catch(e){}
			if(g1=='url-prefix') r.urlPrefixes.push(g3);
			else if(g1=='url') r.urls.push(g3);
			else if(g1=='domain') r.domains.push(g3);
			else if(g1=='regexp') r.regexps.push(g3);
		});
		for(m=0,i=p;i<code.length;i++)
			if(code[i]=='{') m++;
			else if(code[i]=='}') {m--;if(!m) break;}
		if(m) break;
		r.code=code.slice(p+1,i).replace(/^\s+|\s+$/g,'');
		code=code.slice(i+1).replace(/^\s+/,'');
		data.push(r);
	}
	r={error:0};
	if(!code) {
		c=map[d.id];
		if(!c) {
			d.enabled=1;c=newCSS(d);d=_('added');
		} else {
			for(i in d) c[i]=d[i];d=_('updated');
		}
		c.data=data;saveCSS();
		r.message=format(_('UserStyle <$1> is $2!\nCheck it out in the options page.'),c.name,d);
	} else {
		r.error=-1;
		r.message=_('Error parsing CSS code!');
	}
	if(e) e.source.postMessage({
		topic: 'ParsedCSS',
		data: r
	});
}
function fetchURL(url, load){
	var req=new XMLHttpRequest();
	req.open('GET', url, true);
	req.onreadystatechange=function(){if(req.readyState==4) load&&load(req.status,req.responseText);};
	req.send();
}
function parseCSS(e,data){
	var j,d=[],r={error:0};
	if(data.status!=200) {r.error=-1;r.message=_('Error fetching CSS code!');}
	else try{
		j=JSON.parse(data.code);
		j.sections.forEach(function(i){
			d.push({
				domains:i.domains,
				regexps:i.regexps,
				urlPrefixes:i.urlPrefixes,
				urls:i.urls,
				code:i.code
			});
		});
		var c=map[data.id];
		if(!c) {
			data.name=j.name;
			data.enabled=1;
			c=newCSS(data);
			data=_('added');
		} else {
			c.updated=data.updated;
			data=_('updated');
		}
		c.data=d;
		c.url=j.url;
		c.updateUrl=j.updateUrl;
		saveCSS();
		r.message=format(_('UserStyle <$1> is $2!\nCheck it out in the options page.'),c.name,data);
	}catch(e){
		opera.postError(e);
		opera.postError('>>>'+data.code+'<<<');
		r.message=_('Error parsing CSS code!');
		r.error=-1;
	}
	if(e) e.source.postMessage({
		topic: 'ParsedCSS',
		data: r
	});
}
function parseCSSURL(e, data){
	var url=data.url;
	if(data.options) url+='?'+data.options;
	fetchURL(url,function(s,t){data.status=s;data.code=t;parseCSS(e,data);});
}
function installCSS(e,url){
	if(!url) {
		if(installFile) e.source.postMessage({topic:'Confirm',data:_('Do you want to install this UserCSS?')});
	}
}

var messages={
	'LoadCSS':loadCSS,
	'ParseCSSURL':parseCSSURL,
	'ParseFirefoxCSS':parseFirefoxCSS,
	'CheckCSS':checkCSS,
	'InstallCSS':installCSS,
};
function onMessage(e) {
	var message = e.data,c=messages[message.topic];
	if(c) c(e,message.data);
}

var isApplied=getSetting('isApplied',true),
    installFile=getSetting('installFile',true),
    button;
function showButton(show){
	if(show) opera.contexts.toolbar.addItem(button);
	else opera.contexts.toolbar.removeItem(button);
}
function updateIcon() {button.icon='images/icon18'+(isApplied?'':'w')+'.png';}

// Multilingual
var i18nMessages={};
function loadMessages(locale){
	var filename='messages.json';
	if(locale) filename='locales/'+locale+'/'+filename;
	var req=new XMLHttpRequest();
	req.open('GET',filename,false);
	req.send();
	var j=JSON.parse(req.responseText);
	for(var i in j) i18nMessages[i]=j[i];
}
function getI18nString(s) {return i18nMessages[s]||s;}
var _=getI18nString;
try{loadMessages();}catch(e){opera.postError(e);}
function format(){
	var a=arguments;
	if(a[0]) return a[0].replace(/\$(?:\{(\d+)\}|(\d+))/g,function(v,g1,g2){return a[g1||g2]||v;});
}

window.addEventListener('DOMContentLoaded', function() {
	opera.extension.onmessage = onMessage;
	button = opera.contexts.toolbar.createItem({
		title: "Stylish for Opera",
		popup:{
			href: "popup.html",
			width:222,
			height:100
		}
	});
	updateIcon();
	showButton(getSetting('showButton',true));
}, false);
