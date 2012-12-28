function getSetting(key,def){
	try{return JSON.parse(widget.preferences.getItem(key)||'');}catch(e){return saveSetting(key,def);}
}
function saveSetting(key,val){widget.preferences.setItem(key,JSON.stringify(val));return val;}

var css=getSetting('cssList',[]),map={};
css.forEach(function(i){if(i.id) map[i.id]=i; else i.id=getId(map,i);});

/* ================Data format 0.1=================
 * List	[
 * 	Item	{
 * 		name:	String(stylish-description)
 * 		id:	String(style-id||Random)
 * 		options:	Boolean
 * 		updated:	Int
 * 		enabled:	Boolean
 * 		deprefix:	List	['-moz-','-webkit-']
 * 		data:	List	[
 * 					{
 * 					inc:	List	[...]
 * 					exc:	List	[...]
 * 					css:	String
 * 					}
 * 				]
 * 		}
 * 	]
 */
(function(){	// Upgrading data to new version
	if(css[0]&&css[0].css!=undefined) {
		for(var i=0;i<css.length;i++){
			var x=css[i];
			css[i]={
				name:x.name,
				options:0,
				updated:null,
				enabled:1,
				deprefix:[],
				data:[{inc:x.includes,exc:x.excludes,css:x.css}]
			};
			css[i].id=getId(map,css[i]);
		}
	}
})();

function getId(map,d){
	do{var s=Math.random();}while(map[s]);
	map[s]=d;
	return s;
}
function saveCSS(){saveSetting('cssList',css);}
function newCSS(c,save){
	var r={
		name:c?c.name:'New CSS',
		id:c&&c.id,
		options:c&&c.options&&1,
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
	function reg(s){
		if(/^\/.*\/$/.test(s)) return RegExp(s.slice(1,-1));	// Regular-expression
		if(s[0]=='^'||s.slice(-2)=='\\/') return RegExp(s);	// compatible with old version
		return RegExp('^'+str2RE(s)+'$');	// String with wildcards
	}
	var k,f,r,j,F=false;
	for(k=0;k<e.data.length;k++){
		f=true;
		for(j=0;j<e.data[k].inc.length;j++) if(f=reg(e.data[k].inc[j]).test(url)) break;
		if(f) for(j=0;j<e.data[k].exc.length;j++) if(!(f=!reg(e.data[k].exc[j]).test(url))) break;
		if(c) {if(e.enabled&&f) c.push(e.data[k].css);}
		else if(F=F||f) return true;
	}
	return F;
}
function loadCSS(e) {
	var i,c=[];
	if(isApplied) for(i=0;i<css.length;i++) testURL(e.origin,css[i],c);
	e.source.postMessage({
		topic: 'ToggleCSS',
		data: {
			isApplied: isApplied,
			css:c.join('\n')
		}
	});
}
function findCSS(id){if(id) for(var i=0;i<css.length;i++) if(css[i].id==id) return i;return -1;}
function checkCSS(e,d){e.source.postMessage({topic:'CheckedCSS',data:map[d]});}
function parseCSS(e,d){
	var c=null,i,p,m={},I,code=d.code.replace(/\s+$/,''),data=[];
	code.replace(/\/\*\s+@(\w+)\s+(.*?)\s+\*\//g,function(v,g1,g2){m[g1]=g2;});
	for(i in m) if(!d[i]) d[i]=m[i];
	while(code){
		i=code.indexOf('@-moz-document');if(i<0) break;
		p=code.indexOf('{',i);
		m=code.slice(i,p);I=[];
		m.replace(/([\w-]+)\(('|")?(.*?)\2\)/g,function(v,g1,g2,g3){
			if(g1=='url-prefix') I.push(g3+'*');
			else if(g1=='url') I.push('/^'+str2RE(g3)+'$/');
			else if(g1=='domain') I.push('*'+g3+'/*');
			else if(g1=='regexp') I.push('/'+g3+'/');
		});
		for(m=0,i=p;i<code.length;i++)
			if(code[i]=='{') m++;
			else if(code[i]=='}') {m--;if(!m) break;}
		if(m) break;
		m=code.slice(p+1,i).replace(/^\s+|\s+$/g,'');
		code=code.slice(i+1).replace(/^\s+/,'');
		data.push({inc:I,exc:[],css:m});
	}
	if(!code) {
		c=map[d.id];
		if(!c) {d.enabled=1;c=newCSS(d);d=null;}
		else {for(i in d) c[i]=d[i];}
		c.data=data;saveCSS();
	}
	if(e) e.source.postMessage({
		topic: 'ParsedCSS',
		isNew: !d,
		data: c
	});
}

function onMessage(event) {
	var message = event.data;
	if(message.topic=='LoadCSS') loadCSS(event, message.data);
	else if(message.topic=='ParseCSS') parseCSS(event, message.data);
	else if(message.topic=='CheckCSS') checkCSS(event, message.data);
}

var isApplied=getSetting('isApplied',true),installFile=getSetting('installFile',true),
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
	/*var fobj=opera.extension.getFile(filename);
	if(fobj) {
		var fr=new FileReader();
		fr.onload=function(){
			var j=JSON.parse(fr.result);
			for(var i in j) i18nMessages[i]=j[i];
		};
		fr.readAsText(fobj,'utf-8');
	}*/
}
function getI18nString(s) {return i18nMessages[s]||s;}
try{loadMessages();}catch(e){opera.postError(e);}

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
	/*function toggleButton() {button.disabled=!opera.extension.tabs.getFocused();}
	opera.extension.onconnect = toggleButton;
	opera.extension.tabs.onfocus = toggleButton;
	opera.extension.tabs.onblur = toggleButton;*/
}, false);
