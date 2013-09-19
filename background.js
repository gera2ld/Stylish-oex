// Multilingual
function initMessages(callback){
	var data={},req=new XMLHttpRequest();
	req.open('GET','messages.json',true);
	req.onload=function(){
		var i,j=JSON.parse(this.responseText);
		for(i in j) data[i]=j[i];
		if(callback) callback();
	};
	req.send();
	_=function(){
		var args=arguments,k=args[0],r;
		r=data[k];if(r) r=r.message;
		if(r) return r.replace(/\$(?:\{(\d+)\}|(\d+))/g,function(v,g1,g2){return args[g1||g2]||'';});
		else return '';
	};
}

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
/* ===============Data format 0.4==================
 * Database: Stylish
 * metas: {
 * 		id: Auto
 * 		name: String
 * 		url: String
 * 		metaUrl: String
 * 		updateUrl: String
 * 		updated: Integer
 * 		enabled: 0|1
 * }
 * styles: {
 * 		metaId: Integer
 * 		name: String
 * 		domains: List
 * 		regexps: List
 * 		urlPrefixes: List
 * 		urls: List
 * 		code: String
 * }
 */
function dbError(t,e){
	opera.postError('Database error: '+e.message);
}
function initDatabase(callback){
	db=openDatabase('Stylish','0.4','Stylish data',10*1024*1024);
	db.transaction(function(t){
		function executeSql(_t,r){
			var s=sql.shift();
			if(s) t.executeSql(s,[],executeSql,dbError);
			else if(callback) callback();
		}
		var count=0,sql=[
			'CREATE TABLE IF NOT EXISTS metas(id INTEGER PRIMARY KEY,name VARCHAR,url VARCHAR,metaUrl VARCHAR,updateUrl VARCHAR,updated INTEGER,enabled INTEGER)',
			'CREATE TABLE IF NOT EXISTS styles(metaId INTEGER,name VARCHAR,domains TEXT,regexps TEXT,urlPrefixes TEXT,urls TEXT,code TEXT)',
		];
		executeSql();
	});
}
function upgradeData(callback){
	function finish(){
		setOption('version_storage',0.4);
		if(!version) opera.extension.tabs.getAll().forEach(function(i){
			if(/^http:\/\/userstyles\.org\/styles\//.test(i.url)) i.refresh();
		});
		if(callback) callback();
	}
	function upgradeItem(){
		var k,v;
		while(k=widget.preferences.key(i)) {
			if(k in settings) {i++;continue;}
			v=widget.preferences.getItem(k);
			widget.preferences.removeItem(k);
			if(/^us:/.test(k)) {
				o=JSON.parse(v);
				if(/^https?:/.test(o.id)&&!o.url) o.url=o.id;
				delete o.id;
				saveStyle(o,upgradeItem);
				return;
			}
		}
		if(!k) finish();
	}
	var version=getOption('version_storage',0),i=0;
	if(version<0.4) upgradeItem();
	else if(callback) callback();
}
function getMeta(o){
	return {
		id:o.id,
		name:o.name,
		url:o.url,
		metaUrl:o.metaUrl,
		updateURL:o.updateURL,
		updated:o.updated,
		enabled:o.enabled,
	};
}
function getSection(o){
	function notEmpty(i){return i;}
	return {
		name:o.name||'',
		domains:o.domains.split('\n').filter(notEmpty),
		regexps:o.regexps.split('\n').filter(notEmpty),
		urlPrefixes:o.urlPrefixes.split('\n').filter(notEmpty),
		urls:o.urls.split('\n').filter(notEmpty),
		code:o.code||'',
	};
}
function initStyles(callback){
	ids=[];metas={};
	db.readTransaction(function(t){
		t.executeSql('SELECT * FROM metas',[],function(t,r){
			var i,o;
			for(i=0;i<r.rows.length;i++) {
				o=r.rows.item(i);
				ids.push(o.id);metas[o.id]=getMeta(o);
			}
			if(callback) callback();
		});
	});
}
function newStyle(c){
	c=c||{};
	var r={
		name:c.name||_('labelNewStyle'),
		url:c.url,
		id:c.id,
		metaUrl:c.metaUrl,
		updated:c.updated||null,
		enabled:c.enabled!=undefined?c.enabled:1,
		data:[]
	};
	return r;
}
function refreshAll(id,o){
	opera.extension.tabs.getAll().forEach(function(t){
		if(t.port) {
			var c=[],d={};
			o.forEach(function(i){
				i=testURL(t.url,i);
				if(i) c.push(i);
			});
			d[id]=c.join('\n');
			t.postMessage({topic:'LoadedStyle',data:{isApplied:settings.isApplied,styles:d}});
		}
	});
}
function enableStyle(id,v,callback){
	var s=metas[id];if(!s) return;
	s.enabled=v?1:0;
	db.transaction(function(t){
		t.executeSql('UPDATE metas SET enabled=? WHERE id=?',[s.enabled,id],function(t,r){
			if(r.rowsAffected) {
				updateItem({id:id,status:0});
				if(s.enabled) t.executeSql('SELECT * FROM styles WHERE metaId=?',[id],function(t,r){
					var d=[];
					if(r.rows.length) for(i=0;i<r.rows.length;i++) d.push(getSection(r.rows.item(i)));
					refreshAll(id,d);
				}); else refreshAll(id,[]);
				if(callback) callback();
			}
		},dbError);
	});
}
function saveStyle(o,callback){
	function finish(){
		if(o.data) {
			refreshAll(o.id,o.data);
			delete o.data;
		}
		if(callback) callback(o);
	}
	db.transaction(function(t){
		var d=[];
		d.push(parseInt(o.id)||null);
		d.push(o.name);
		d.push(o.url);
		d.push(o.metaUrl);
		d.push(o.updateUrl);
		d.push(o.updated||0);
		d.push(o.enabled);
		t.executeSql('REPLACE INTO metas(id,name,url,metaUrl,updateUrl,updated,enabled) VALUES(?,?,?,?,?,?,?)',d,function(t,r){
			o.id=r.insertId;
			if(!(o.id in metas)) ids.push(o.id);
			metas[o.id]=o;
			if(o.data) t.executeSql('DELETE FROM styles WHERE metaId=?',[o.id],function(t,r){
				var i=0;
				function addSection(){
					var d=[],r=o.data[i++];
					if(r) {
						d.push(o.id);
						d.push(r.name||'');
						d.push(r.domains.join('\n'));
						d.push(r.regexps.join('\n'));
						d.push(r.urlPrefixes.join('\n'));
						d.push(r.urls.join('\n'));
						d.push(r.code);
						t.executeSql('INSERT INTO styles(metaId,name,domains,regexps,urlPrefixes,urls,code) VALUES(?,?,?,?,?,?,?)',d,addSection,dbError);
					} else finish();
				}
				addSection();
			},dbError); else finish();
		},dbError);
	});
}
function removeStyle(i){
	var id=ids.splice(i,1)[0];
	db.transaction(function(t){
		t.executeSql('DELETE FROM metas WHERE id=?',[id],function(t,r){
			t.executeSql('DELETE FROM styles WHERE metaId=?',[id],function(t,r){
				delete metas[id];
				var d={};d[id]=null;
				opera.extension.broadcastMessage({topic:'LoadedStyle',data:{isApplied:settings.isApplied,styles:d}});
			},dbError);
		},dbError);
	});
}
function getStyle(id,callback,t){
	function get(t){
		t.executeSql('SELECT * FROM styles WHERE metaId=?',[id],function(t,r){
			var o=metas[id];
			if(o) {
				o=getMeta(o);o.data=[];
				for(i=0;i<r.rows.length;i++) o.data.push(getSection(r.rows.item(i)));
				if(callback) callback(o);
			}
		});
	}
	if(t) get(t); else db.readTransaction(get);
}
function getStyles(ids,callback){
	var d=[];
	db.readTransaction(function(t){
		function loop(){
			var id=ids.shift();
			if(id) getStyle(id,function(o){
				d.push(o);loop();
			},t); else callback(d);
		}
		loop();
	});
}
function str2RE(s){return s.replace(/(\.|\?|\/)/g,'\\$1').replace(/\*/g,'.*?');}
function testURL(url,d){
	function testDomain(i){
		return RegExp('://(|[^/]*\\.)'+i.replace(/\./g,'\\.')+'/').test(url);
	}
	function testRegexp(i){
		return RegExp(i).test(url);
	}
	function testUrlPrefix(i){
		return url.slice(0,i.length)==i;
	}
	function testUrl(i){
		return i==url;
	}
	function test(k){
		if(f>0) return;
		var r=d[k],i,o;
		if(k=='domains') o=testDomain;
		else if(k=='regexps') o=testRegexp;
		else if(k=='urlPrefixes') o=testUrlPrefix;
		else if(k=='urls') o=testUrl;
		if(r.some(o)) {f=1;return;}
		if(r.length&&f<0) f=0;
	}
	var f=-1;
	test('domains');test('regexps');test('urlPrefixes');test('urls');
	if(f) return d.code;
}
function loadStyle(e) {
	var c={};
	db.readTransaction(function(t){
		t.executeSql('SELECT * FROM styles ORDER BY metaId',[],function(t,r){
			var i,v,s,d,o;
			for(i=0;i<r.rows.length;i++) {
				v=r.rows.item(i);
				s=getSection(v);
				d=testURL(e.origin,s);
				if(d!=null) {
					o=c[v.metaId];
					if(!o) o=c[v.metaId]=[];
					if(d&&metas[v.metaId].enabled) o.push(d);	// ignore null string
				}
			}
			for(i in c) c[i]=c[i].join('\n');
			e.source.postMessage({topic:'LoadedStyle',data:{isApplied:settings.isApplied,styles:c}});
		},dbError);
	});
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
function checkStyle(e,d){
	db.readTransaction(function(t){
		t.executeSql('SELECT id,updated FROM metas WHERE url=?',[d],function(t,r){
			var o=null;
			if(r.rows.length) o=getMeta(r.rows.item(0));
			e.source.postMessage({topic:'CheckedStyle',data:o});
		},dbError);
	});
}
function installStyle(e,data){
	if(data) fetchURL(data.updateUrl,function(){
		data.status=this.status;data.code=this.responseText;parseCSS(e,data);
	}); else
		e.source.postMessage({topic:'ConfirmInstall',data:_('msgConfirm')});
}
function parseFirefoxCSS(e,d,callback){
	function finish(){
		if(e) e.source.postMessage({topic:'ParsedCSS',data:r});
		if(callback) callback(r);
	}
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
	r={status:0,message:_('msgUpdated')};
	if(!code) {
		c=metas[d.id];
		if(!c) {c=newStyle(d);r.status=1;}
		else for(i in d) c[i]=d[i];
		c.data=data;
		saveStyle(c,function(){
			r.id=c.id;updateItem(r);finish();
		});
	} else {
		r.status=-1;
		r.message=_('msgErrorParsing');
		finish();
	}
}
function parseCSS(e,data,callback){
	function finish(){
		if(e) e.source.postMessage({topic:'ParsedCSS',data:r});
		if(callback) callback(r);
	}
	var j,c=null,d=[],r={status:0,message:_('msgUpdated')};
	if(data.status!=200) {
		r.status=-1;r.message=_('msgErrorFetchingStyle');
	} else try{
		j=JSON.parse(data.code);
	}catch(e){
		opera.postError(e);
		r.status=-1;
		r.message=_('msgErrorParsing');
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
		c=data.id&&metas[data.id];
		if(!c) {
			data.name=j.name;
			c=newStyle(data);
			r.status=1;
		} else c.updated=data.updated;
		c.data=d;
		c.updateUrl=j.updateUrl;
		saveStyle(c,function(){
			r.id=c.id;updateItem(r);finish();
		});
	} else finish();
}
function parseJSON(e,data,callback){
	function finish(){
		if(e) e.source.postMessage({topic:'ParsedCSS',data:r});
		if(callback) callback(r);
	}
	var r={status:0,message:_('msgUpdated')},o,c;
	try{
		o=JSON.parse(data.code);
		if(!o.id||!(o.id in metas)) {
			r.status=1;
			r.message=_('msgInstalled');
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
		saveStyle(c,function(){
			r.id=c.id;updateItem(r);finish();
		});
	}catch(e){
		opera.postError(e);
		r.status=-1;
		r.message=_('msgErrorParsing');
		finish();
	}
}
var _update={};
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
function checkUpdateO(o){
	if(_update[o.id]) return;_update[o.id]=1;
	function finish(){delete _update[o.id];}
	var r={id:o.id,hideUpdate:1,status:2};
	function update(){
		if(o.updateUrl) {
			r.message=_('msgUpdating');
			fetchURL(o.updateUrl,function(){
				parseCSS(null,{status:this.status,id:c.id,updated:d,code:this.responseText});
			});
		} else r.message='<span class=new>'+_('msgNewVersion')+'</span>';
		updateItem(r);finish();
	}
	if(o.metaUrl) {
		r.message=_('msgCheckingForUpdate');updateItem(r);
		fetchURL(o.metaUrl,function(){
			r.message=_('msgErrorFetchingUpdateInfo');
			if(this.status==200) try{
				d=getTime(JSON.parse(this.responseText));
				if(!o.updated||o.updated<d) {
					if(o.updateUrl) return update();
					r.message=_('msgNoUpdate');
				} else r.message=_('msgNoUpdate');
			} catch(e) {opera.postError(e);}
			delete r.hideUpdate;
			updateItem(r);finish();
		});
	} else finish();
}
function checkUpdate(id){
	checkUpdateO(metas[id]);
}
function checkUpdateAll(){
	ids.forEach(function(i){
		var o=metas[i];
		if(o.metaUrl) checkUpdateO(o);
	});
}

function getOption(k,def){
	var v=widget.preferences.getItem(k);
	try{
		v=JSON.parse(v);
	}catch(e){
		v=def;
		if(v!=undefined) setOption(k,v);
	}
	settings[k]=v;
	return v;
}
function setOption(k,v){
	widget.preferences.setItem(k,JSON.stringify(v));
	settings[k]=v;
	return v;
}
function initSettings(){
	getOption('isApplied',true);
	getOption('showButton',true);
	getOption('firefoxCSS',false);
}
function showButton(show){
	if(show) opera.contexts.toolbar.addItem(button);
	else opera.contexts.toolbar.removeItem(button);
}
function updateIcon() {button.icon='images/icon18'+(settings.isApplied?'':'w')+'.png';}
function updateItem(r){	// update loaded options pages
	for(var i=0;i<_updateItem.length;)
		try{
			_updateItem[i](r);
			i++;
		}catch(e){
			_updateItem.splice(i,1);
		}
}
function initIcon(){
	button=opera.contexts.toolbar.createItem({
		title:_('extName'),
		popup:{
			href:"menu.html",
			width:222,
			height:100
		}
	});
	updateIcon();
	showButton(settings.showButton);
}
var db,_,button,settings={},_updateItem=[],ids,metas,
		maps={
			LoadStyle:loadStyle,
			ParseFirefoxCSS:parseFirefoxCSS,
			CheckStyle:checkStyle,
			InstallStyle:installStyle,
			ParseJSON:parseJSON,
		};
if(parseInt(opera.version())<12)	// Check old version of Opera
	opera.extension.tabs.create({url:'oldversion.html'});
else initMessages(function(){
	initSettings();
	initIcon();
	initDatabase(function(){
		initStyles(function(){
			upgradeData(function(){
				opera.extension.onmessage=function(e){
					var m=e.data,c=maps[m.topic];
					if(c) try{c(e,m.data);}catch(e){opera.postError(e);}
				};
			});
		});
	});
});
