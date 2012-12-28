function $(i){return document.getElementById(i);}
var bg=opera.extension.bgProcess,L=$('cssList'),O=$('overlay'),_=bg.getI18nString;
function getDate(t){var d=new Date();d.setTime(t*1000);return d.toDateString();}
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

// Main options
function loadName(d,n){
	var a=d.firstChild;
	if(n.id>1) a.href='http://userstyles.org/styles/'+n.id+'/';
	a.title=n.name;
	a.innerText=n.name||'('+_('Null')+')';
}
function loadItem(d,n){
	if(!n.enabled) d.className='disabled';
	d.innerHTML='<a class="name ellipsis"></a>'
	+'<span class=updated>'+(n.updated?_('Last updated: ')+getDate(n.updated):'')+'</span>'
	+'<span class=message></span>'
	+'<div class=panel>'
		+(n.id>1?'<button onclick="work(this,3);">'+_('Update')+'</button> ':'')
		+'<button onclick="work(this,0);">'+_('Edit')+'</button> '
		+'<button onclick="work(this,1);">'+_(n.enabled?'Disable':'Enable')+'</button> '
		+'<button onclick="work(this,2);">'+_('Remove')+'</button>'
	+'</div>';
	loadName(d,n);
}
function addItem(n){
	var d=document.createElement('div');
	loadItem(d,n);
	L.appendChild(d);
	return d;
}
function work(o,f){
	var p=o,i;
	while(p&&p.parentNode!=L) p=p.parentNode;i=Array.prototype.indexOf.call(L.childNodes,p);
	switch(f){
		case 0:	// Edit
			edit(i);
			break;
		case 1:	// Enable
			if(bg.css[i].enabled=!bg.css[i].enabled) {
				p.classList.remove('disabled');
				o.innerText=_('Disable');
			} else {
				p.classList.add('disabled');
				o.innerText=_('Enable');
			}
			bg.saveCSS();
			break;
		case 2:	// Remove
			bg.removeCSS(i);
			L.removeChild(p);
			break;
		case 3:	// Update
			check(i);
			break;
	}
}
function load(){
	L.innerHTML='';
	for(var i=0;i<bg.css.length;i++) addItem(bg.css[i]);
}
load();
$('bNew').onclick=function(){var d=bg.newCSS(null,true);addItem(d);};
$('bUpdate').onclick=function(){for(var i=0;i<bg.css.length;i++) if(bg.css[i].id>1) check(i);};
function showDialog(D){
	O.classList.add('o_in');
	O.onclick=D.onclose;
	D.classList.remove('hide');
	D.style.top=(window.innerHeight-D.offsetHeight)/2+'px';
	D.style.left=(window.innerWidth-D.offsetWidth)/2+'px';
}
function closeDialog(D){
	O.classList.remove('o_in');
	D.classList.add('hide');
}

// Advanced
var A=$('advanced');
$('bAdvanced').onclick=function(){showDialog(A);};
$('cShow').checked=bg.getSetting('showButton',true);
$('cShow').onchange=function(){bg.showButton(bg.saveSetting('showButton',this.checked));};
$('cInstall').checked=bg.getSetting('installFile',true);
$('cInstall').onchange=function(){bg.saveSetting('installFile',this.checked);};
$('aExport').onclick=function(){closeDialog(A);showDialog(X);xLoad();};
A.onclose=$('aClose').onclick=function(){closeDialog(A);};

// Export
var X=$('export'),xL=$('xList');
function xLoad() {
	xL.innerHTML='';
	for(var i=0;i<bg.css.length;i++) {
		var d=document.createElement('div');
		d.className='ellipsis';
		d.title=bg.css[i].name;
		d.innerText=bg.css[i].name||'(null)';
		xL.appendChild(d);
	}
}
xL.onclick=function(e){
	var t=e.target;
	if(t.parentNode!=this) return;
	t.classList.toggle('selected');
};
$('bSelect').onclick=function(){
	var c=xL.childNodes,v,i;
	for(i=0;i<c.length;i++) if(!c[i].classList.contains('selected')) break;
	v=i<c.length;
	for(i=0;i<c.length;i++) if(v) c[i].classList.add('selected'); else c[i].classList.remove('selected');
};
function getCSS(c){
	var d=['/* @id '+c.id+ ' */','/* @name '+c.name+' */'];
	c.data.forEach(function(i){
		var p=[];
		i.inc.forEach(function(j){
			var m;
			if(m=j.match(/^([^\*]*)\*$/)) p.push('url-prefix("'+m[1]+'")');
			else if(m=j.match(/^\/\^([^\*]+)\$\/$/)) p.push('url("'+m[1].replace(/\\([\.\?])/g,'$1')+'")');
			else if(m=j.match(/^\*([^\/\?\*]+)\/\*$/)) p.push('domain("'+m[1].replace(/\\\./g,'.')+'")');
			else if(m=j.match(/^\/(.*?)\/$/)) p.push('regexp("'+m[1]+'")');
		});
		d.push('@-moz-document '+p.join(',\n')+'{\n'+i.css+'\n}\n');
	});
	return d.join('\n');
}
$('bExport').onclick=function(){
	var z=new JSZip(),n,names={};
	for(i=0;i<bg.css.length;i++) if(xL.childNodes[i].classList.contains('selected')) {
		n=bg.css[i].name||'Noname';s=0;
		while(names[n]) n=bg.css[i].name+(++s);
		names[n]=1;
		z.file(n+'.user.css',getCSS(bg.css[i]));
	}
	n=z.generate();
	window.open('data:application/zip;base64,'+n);
};
X.onclose=$('bClose').onclick=function(){closeDialog(X);};

// Update checker
function check(i){
	var l=L.childNodes[i],o=l.childNodes[3].firstChild,m=l.childNodes[2],s=bg.css[i],d;
	m.innerHTML=_('Checking for updates...');
	o.disabled=true;
	function update(){
		m.innerHTML=_('Updating...');
		req=new window.XMLHttpRequest();
		req.open('GET', 'http://userstyles.org/styles/'+s.id+'.css', true);
		req.onreadystatechange=function(){
			if(req.readyState==4) {
				if(req.status==200) {
					bg.parseCSS(null,{id:s.id,updated:d,code:req.responseText});
					l.childNodes[1].innerHTML=_('Last updated: ')+getDate(d);
					m.innerHTML=_('Update finished!');
				} else m.innerHTML=_('Update failed!');
				o.disabled=false;
			}
		};
		req.send();
	}
	var req=new window.XMLHttpRequest();
	req.open('GET', 'http://userstyles.org/styles/'+s.id+'.json', true);
	req.onreadystatechange=function(){
		if(req.readyState==4) try {
			d=getTime(JSON.parse(req.responseText));
			if(!s.updated||s.updated<d) {
				if(s.options) m.innerHTML='<span class=new>'+_('New version is found!')+'</span> '+_('Go to homepage for update.');
				else return update();
			} else m.innerHTML=_('No update is found!');
		} catch(e) {
			m.innerHTML=_('Failed fetching update information.');
			opera.postError(e);
		}
		o.disabled=false;
	};
	req.send();
}

// CSS Editor
var M=$('editor'),S=$('mSection'),N=$('mName'),
	I=$('mInc'),E=$('mExc'),T=$('mCss'),dM=$('mDeMoz'),dW=$('mDeWebkit');
function cloneData(d){
	var c=[];
	for(var i=0;i<d.length;i++) if(d[i].css) c.push({
		inc:d[i].inc.concat(),
		exc:d[i].exc.concat(),
		css:d[i].css
	});
	return c;
}
function edit(i){
	showDialog(M);
	M.cur=i;M.dirty=false;M.css=bg.css[M.cur];
	M.data=cloneData(M.css.data);
	S.innerHTML='';S.cur=null;S.dirty=false;
	N.value=M.css.name;
	for(var i=0;i<M.data.length;i++) mAddItem(i+1);
	dM.checked=M.css.deprefix.indexOf('-moz-')>=0;
	dW.checked=M.css.deprefix.indexOf('-webkit-')>=0;
	mShow();
}
function mAddItem(n){
	var d=document.createElement('div');
	d.innerText=n;
	S.appendChild(d);
	return d;
}
function split(t){return t.replace(/^\s+|\s+$/g,'').split(/\s*\n\s*/).filter(function(e){return e});}
function mSaveSection(r){
	if(M.data[S.cur]){
		if(S.dirty){
			S.dirty=false;
			M.data[S.cur].inc=split(I.value);
			M.data[S.cur].exc=split(E.value);
			M.data[S.cur].css=T.value;
		}
		if(r) S.childNodes[S.cur].classList.remove('selected');
	}
}
function mSave(){
	if(M.dirty){
		M.css.name=N.value;
		mSaveSection();
		var d=M.css.deprefix=[];
		if(dM.checked) d.push('-moz-');
		if(dW.checked) d.push('-webkit-');
		M.dirty=false;
		return true;
	} else return false;
}
function mShow(){
	var c=S.childNodes[S.cur];
	I.disabled=E.disabled=T.disabled=!c;
	if(c) {
		S.childNodes[S.cur].classList.add('selected');
		I.value=M.data[S.cur].inc.join('\n');
		E.value=M.data[S.cur].exc.join('\n');
		T.value=M.data[S.cur].css;
	} else I.value=E.value=T.value='';
}
function mClose(){
	closeDialog(M);
	loadName(L.childNodes[M.cur],bg.css[M.cur]);
	M.cur=M.css=null;
}
I.onchange=E.onchange=T.onchange=$('mDeMoz').onchange=$('mDeWebkit').onchange=function(e){M.dirty=S.dirty=true;};
S.onclick=function(e){
	var t=e.target;
	if(t.parentNode!=this) return;
	mSaveSection(1);S.cur=Array.prototype.indexOf.call(S.childNodes,t);
	if(!t.classList.contains('selected')) mShow();
};
N.onchange=function(){M.css.name=N.value;M.dirty=true;};
$('mNew').onclick=function(){
	var d={inc:[],exc:[],css:''};
	mSaveSection(1);
	S.cur=M.data.length;
	M.data.push(d);
	mAddItem(M.data.length);
	mShow();
};
$('mDel').onclick=function(){
	if(S.cur) {
		M.data.splice(S.cur,1);
		S.removeChild(S.lastChild);
		mShow();M.dirty=true;
	}
};
$('mSave').onclick=function(){
	if(mSave()) {M.css.data=cloneData(M.data);bg.saveCSS();}
};
$('mSaveClose').onclick=function(){
	if(mSave()) {bg.css[M.cur].data=M.data;bg.saveCSS();}
	mClose();
};
M.onclose=$('mClose').onclick=function(){
	if(M.dirty) {
		var e=confirm(_('Modifications are not saved!\nClick OK to discard them or Cancel to stay.'));
		if(!e) return;
	}
	mClose();
};
