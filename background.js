function getItem(key,def){
	var v=widget.preferences.getItem(key);
	if(v==null&&def) return setItem(key,def);
	try{return JSON.parse(v);}catch(e){return def;}
}
function setItem(key,val){
	widget.preferences.setItem(key,JSON.stringify(val));
	return val;
}

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
	if(a[0]) return a[0].replace(/\$(?:\{(\d+)\}|(\d+))/g,function(v,g1,g2){g1=a[g1||g2];if(g1==undefined) g1=v;return g1;});
}

// Check old version of Opera
(function(v){
	v=parseInt(v);
	if(v<12) {
		opera.extension.tabs.create({url:'oldversion.html'});
		null[0];	// to stop running
	}
})(opera.version());

/* ===============Data format 0.3==================
 * ids	List [id]
 * us:id Item	{
 * 		id:	url||random
 * 		name:	String(stylish-description)
 * 		url:	String		// Homepage
 * 		metaUrl:	String	// for update checking
 * 		updateUrl:	String	// for update
 * 		updated:	Int
 * 		enabled:	Boolean
 * 		deprefix:	List	['-moz-','-webkit-']
 * 		data:	List	[
 * 					{
 * 					name:	String
 * 					domains:	List	[...]
 * 					regexps:	List	[...]
 * 					urlPrefixes:	List	[...]
 * 					urls:		List	[...]
 * 					code:		String
 * 					}
 * 				]
 * 		}
 */
(function(){	// Upgrading data to new version
	var version=getItem('version_storage');
	if(version<0.3){
		setItem('version_storage',0.3);
		opera.extension.tabs.getAll().forEach(function(i){
			if(/^http:\/\/userstyles\.org\/styles\//.test(i.url)) i.refresh();
		});
	}
})();
var ids=getItem('ids',[]),map={};
ids.forEach(function(i){map[i]=getItem('us:'+i);});
function saveIDs(){setItem('ids',ids);}
function newStyle(c,save){
	var r={
		name:c?c.name:_('New Style'),
		url:c&&c.url,
		id:c&&c.id,
		metaUrl:c&&c.metaUrl,
		updated:c?c.updated:null,
		enabled:c&&c.enabled!=undefined?c.enabled:1,
		deprefix:c&&c.deprefix||[],
		data:[]
	};
	if(!r.id) r.id=Date.now()+Math.random().toString().substr(1);
	if(save) saveStyle(r);
	return r;
}
function saveStyle(s){
	if(!map[s.id]) {ids.push(s.id);saveIDs();}
	setItem('us:'+s.id,map[s.id]=s);
	opera.extension.tabs.getAll().forEach(function(t){
		if(t.port) {
			var d={};d[s.id]=testURL(t.url,s);
			t.postMessage({topic:'UpdateStyle',data:d});
		}
	});
}
function removeStyle(i){
	i=ids.splice(i,1)[0];saveIDs();delete map[i];
	var d={};d[i]=undefined;
	opera.extension.broadcastMessage({topic:'UpdateStyle',data:d});
}

function str2RE(s){return s.replace(/(\.|\?|\/)/g,'\\$1').replace(/\*/g,'.*?');}
function testURL(url,e){
	function testDomain(){
		r=d.domains;
		for(i=0;i<r.length;i++) if(RegExp('://(|[^/]*\\.)'+r[i].replace(/\./g,'\\.')+'/').test(url)) return f=1;
		if(i&&f<0) f=0;
	}
	function testRegexp(){
		r=d.regexps;
		for(i=0;i<r.length;i++) if(RegExp(r[i]).test(url)) return f=1;
		if(i&&f<0) f=0;
	}
	function testUrlPrefix(){
		r=d.urlPrefixes;
		for(i=0;i<r.length;i++) if(url.substr(0,r[i].length)==r[i]) return f=1;
		if(i&&f<0) f=0;
	}
	function testUrl(){
		r=d.urls;
		for(i=0;i<r.length;i++) if(r[i]==url) return f=1;
		if(i&&f<0) f=0;
	}
	var k,f,d,i,r,c=[];
	for(k=0;k<e.data.length;k++){
		d=e.data[k];f=-1;
		testDomain();testRegexp();testUrlPrefix();testUrl();
		if(f) c.push(e.enabled?d.code:'');
	}
	if(c.length) {
		c=c.join('');
		if(e.deprefix.length) c=c.replace(new RegExp('('+e.deprefix.join('|')+')','g'),'')
		return c;
	}
}
function loadStyle(e) {
	var c={};
	ids.forEach(function(i){
		var d=testURL(e.origin,map[i]);
		if(typeof d=='string') c[i]=d;
	});
	e.source.postMessage({
		topic: 'LoadedStyle',
		data: {isApplied:isApplied,data:c}
	});
}
function checkStyle(e,d){e.source.postMessage({topic:'CheckedStyle',data:map[d]});}
function parseFirefoxCSS(e,d){
	var c=null,i,p,m,r,code=d.code.replace(/\s+$/,''),data=[];
	code.replace(/\/\*\s+@(\w+)\s+(.*?)\s+\*\//g,function(v,g1,g2){
		if(d[g1]==undefined) {
			d[g1]=g2;
			if(['updated','enabled'].indexOf(g1)>=0)
				try{d[g1]=JSON.parse(d[g1]);}catch(e){delete d[g1];}
		}
	});
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
	r={status:0,message:_('Style updated.')};
	if(!code) {
		c=map[d.id];
		if(!c) {c=newStyle(d);r.status=1;}
		else for(i in d) c[i]=d[i];
		c.data=data;saveStyle(c);
	} else {
		r.status=-1;
		r.message=_('Error parsing CSS code!');
	}
	if(e) e.source.postMessage({topic: 'ParsedCSS',data: r});
	if(c) {r.item=ids.indexOf(c.id);optionsUpdate(r);}
	return r;
}
function fetchURL(url, cb){
	var req=new XMLHttpRequest();
	if(cb) req.onloadend=cb;
	if(url.length>2000) {
		var parts=url.split('?');
		req.open('POST',parts[0],true);
		req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		req.send(parts[1]);
	} else {
		req.open('GET', url, true);
		req.send();
	}
}
function parseCSS(e,data){
	var j,c=null,d=[],r={status:0,message:_('Style updated.')};
	if(data.status!=200) {r.status=-1;r.message=_('Error fetching CSS code!');}
	else try{
		j=JSON.parse(data.code);
	}catch(e){
		opera.postError(e);
		r.status=-1;
		r.message=_('Error parsing CSS code!');
	}
	if(!r.status){
		j.sections.forEach(function(i){
			d.push({
				name:i.name||'',
				domains:i.domains,
				regexps:i.regexps,
				urlPrefixes:i.urlPrefixes,
				urls:i.urls,
				code:i.code
			});
		});
		c=map[data.id];
		if(!c) {
			data.name=j.name;
			data.enabled=1;
			c=newStyle(data);
			r.status=1;
		} else c.updated=data.updated;
		c.data=d;
		c.url=j.url;
		c.updateUrl=j.updateUrl;
		saveStyle(c);
	}
	if(e) e.source.postMessage({topic:'ParsedCSS',data:r});
	if(c) {r.item=ids.indexOf(c.id);optionsUpdate(r);}
	return r;
}
function installStyle(e,data){
	if(data) fetchURL(data.url,function(){
		data.status=this.status;data.code=this.responseText;parseCSS(e,data);
	}); else if(installFile)
		e.source.postMessage({topic:'ConfirmInstall',data:_('Do you want to install this style?')});
}
function parseJSON(e,data){
	var r={status:0,message:_('Style updated.')},o,c;
	try{
		o=JSON.parse(data.code);
		if(!map[o.id]) {
			r.status=1;
			r.message=_('Style installed.');
		}
		c=newStyle(o);
		o.data.forEach(function(i){
			c.data.push({
				name:i.name||'',
				domains:i.domains,
				regexps:i.regexps,
				urlPrefixes:i.urlPrefixes,
				urls:i.urls,
				code:i.code||'',
			});
		});
		saveStyle(c);
	}catch(e){
		opera.postError(e);
		r.status=-1;
		r.message=_('Error parsing CSS code!');
	}
	if(e) e.source.postMessage({topic:'ParsedCSS',data:r});
	if(c) {r.item=ids.indexOf(c.id);optionsUpdate(r);}
	return r;
}

var messages={
	LoadStyle:loadStyle,
	ParseFirefoxCSS:parseFirefoxCSS,
	CheckStyle:checkStyle,
	InstallStyle:installStyle,
	ParseJSON:parseJSON,
};

var isApplied=getItem('isApplied'),installFile=getItem('installFile');
function showButton(show){
	if(show) opera.contexts.toolbar.addItem(button);
	else opera.contexts.toolbar.removeItem(button);
}
function updateIcon() {button.icon='images/icon18'+(isApplied?'':'w')+'.png';}
function optionsUpdate(r){	// update loaded options pages
	if(options&&options.window)
		try{options.window.updateItem(r);}catch(e){opera.postError(e);options={};}
}

opera.extension.onmessage=function(e){
	var message = e.data,c=messages[message.topic];
	if(c) c(e,message.data);
};
var button = opera.contexts.toolbar.createItem({
	title: "Stylish",
	popup:{
		href:"popup.html",
		width:222,
		height:100
	}
    }),options={},optionsURL=new RegExp('^'+(location.protocol+'//'+location.host+'/options.html').replace(/\./g,'\\.'));
updateIcon();
showButton(getItem('showButton'));
opera.extension.tabs.oncreate=function(e){
	if(optionsURL.test(e.tab.url)) {
		if(options.tab&&!options.tab.closed) {e.tab.close();options.tab.focus();}
		else options={tab:e.tab};
	}
};
opera.extension.tabs.onclose=function(e){if(options.tab===e.tab) options={};};
