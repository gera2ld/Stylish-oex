function $(i){return document.getElementById(i);}
var bg=opera.extension.bgProcess,L=$('cList'),O=$('overlay'),_=bg.getI18nString;
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
	if(n.url) a.href=n.url;
	a.title=n.name;
	a.innerText=n.name||'('+_('Null name')+')';
}
function loadItem(d,n){
	if(!n.enabled) d.className='disabled';
	d.innerHTML='<a class="name ellipsis"></a>'
	+'<span class=updated>'+(n.updated?_('Last updated: ')+getDate(n.updated):'')+'</span>'
	+(n.metaUrl?'<a href=# data=update class=update>'+_('Check for Updates')+'</a> ':'')
	+'<span class=message></span>'
	+'<div class=panel>'
		+'<button data=edit>'+_('Edit')+'</button> '
		+'<button data=enable>'+_(n.enabled?'Disable':'Enable')+'</button> '
		+'<button data=remove>'+_('Remove')+'</button>'
	+'</div>';
	loadName(d,n);
}
function addItem(n){
	var d=document.createElement('div');
	loadItem(d,n);
	L.appendChild(d);
	return d;
}
L.onclick=function(e){
	var o=e.target,d=o.getAttribute('data'),p;
	if(!d) return;
	e.preventDefault();
	for(p=o;p&&p.parentNode!=L;p=p.parentNode);
	var i=Array.prototype.indexOf.call(L.childNodes,p);
	switch(d){
		case 'edit':
			edit(i);
			break;
		case 'enable':
			if(bg.css[i].enabled=!bg.css[i].enabled) {
				p.classList.remove('disabled');
				o.innerText=_('Disable');
			} else {
				p.classList.add('disabled');
				o.innerText=_('Enable');
			}
			bg.saveCSS();
			break;
		case 'remove':
			bg.removeCSS(i);
			L.removeChild(p);
			break;
		case 'update':
			check(i);
			break;
	}
};
function load(){
	L.innerHTML='';
	for(var i=0;i<bg.css.length;i++) addItem(bg.css[i]);
}
load();
$('bNew').onclick=function(){var d=bg.newCSS(null,true);addItem(d);};
$('bUpdate').onclick=function(){for(var i=0;i<bg.css.length;i++) if(bg.css[i].metaUrl) check(i);};
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
	var d=[];
	['id','name','url','metaUrl','updateUrl'].forEach(function(i){
		if(c[i]) d.push('/* @'+i+' '+c[i].toString().replace(/\*/g,'+')+' */');
	});
	c.data.forEach(function(i){
		var p=[];
		i.domains.forEach(function(j){p.push('domain('+JSON.stringify(j)+')');});
		i.regexps.forEach(function(j){p.push('regexp('+JSON.stringify(j)+')');});
		i.urlPrefixes.forEach(function(j){p.push('url-prefix('+JSON.stringify(j)+')');});
		i.urls.forEach(function(j){p.push('url('+JSON.stringify(j)+')');});
		d.push('@-moz-document '+p.join(',\n')+'{\n'+i.code+'\n}\n');
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
	var l=L.childNodes[i],o=l.querySelector('[data=update]'),m=l.querySelector('.message'),c=bg.css[i],d;
	m.innerHTML=_('Checking for updates...');
	o.classList.add('hide');
	function update(){
		m.innerHTML=_('Updating...');
		bg.fetchURL(c.updateUrl,function(s,t){
			var r=bg.parseCSS(null,{status:s,id:c.id,updated:d,code:t});
			if(r.error) m.innerHTML=r.message;
			else {
				l.childNodes[1].innerHTML=_('Last updated: ')+getDate(d);
				m.innerHTML=_('Update finished!');
			}
			o.classList.remove('hide');
		});
	}
	bg.fetchURL(c.metaUrl,function(s,t){
		try {
			d=getTime(JSON.parse(t));
			if(!c.updated||c.updated<d) {
				if(c.updateUrl) return update();
				else m.innerHTML='<a class=new title="'+_('Please go to homepage for update since there are options for this style.')+'">'+_('New version found')+'</a>';
			} else m.innerHTML=_('No update found');
		} catch(e) {
			m.innerHTML=_('Failed fetching update information.');
			opera.postError(e);
		}
		o.classList.remove('hide');
	});
}

// Style Editor
var M=$('editor'),S=$('mSection'),N=$('mName'),T=$('mCode'),
    rD=$('mDomain'),rR=$('mRegexp'),rP=$('mUrlPrefix'),rU=$('mUrl'),
    dM=$('mDeMoz'),dW=$('mDeWebkit');
function cloneData(d){
	var c=[];
	d.forEach(function(i){
		if(i.code) c.push({
			domains:i.domains.concat(),
			regexps:i.regexps.concat(),
			urlPrefixes:i.urlPrefixes.concat(),
			urls:i.urls.concat(),
			code:i.code
		});
	});
	return c;
}
function edit(i){
	showDialog(M);
	M.cur=i;M.dirty=false;M.css=bg.css[M.cur];
	M.data=cloneData(M.css.data);
	S.innerHTML='';S.cur=0;S.dirty=false;
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
			M.data[S.cur].domains=split(rD.value);
			M.data[S.cur].regexps=split(rR.value);
			M.data[S.cur].urlPrefixes=split(rP.value);
			M.data[S.cur].urls=split(rU.value);
			M.data[S.cur].code=T.value;
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
	rD.disabled=rR.disabled=rP.disabled=rU.disabled=T.disabled=!c;
	if(c) {
		S.childNodes[S.cur].classList.add('selected');
		rD.value=M.data[S.cur].domains.join('\n');
		rR.value=M.data[S.cur].regexps.join('\n');
		rP.value=M.data[S.cur].urlPrefixes.join('\n');
		rU.value=M.data[S.cur].urls.join('\n');
		T.value=M.data[S.cur].code;
	} else rD.value=rR.value=rP.value=rU.value=T.value='';
}
function mClose(){
	closeDialog(M);
	loadName(L.childNodes[M.cur],bg.css[M.cur]);
	M.cur=M.css=null;
}
rD.onchange=rR.onchange=rP.onchange=rU.onchange=T.onchange=function(e){M.dirty=S.dirty=true;};
N.onchange=$('mDeMoz').onchange=$('mDeWebkit').onchange=function(e){M.dirty=true;};
S.onclick=function(e){
	var t=e.target;
	if(t.parentNode!=this) return;
	mSaveSection(1);S.cur=Array.prototype.indexOf.call(S.childNodes,t);
	if(!t.classList.contains('selected')) mShow();
};
$('mNew').onclick=function(){
	var d={domains:[],regexps:[],urlPrefixes:[],urls:[],code:''};
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
	if(mSave()) {M.css.data=cloneData(M.data);bg.saveCSS(M.css);}
};
$('mSaveClose').onclick=function(){
	if(mSave()) {bg.css[M.cur].data=M.data;bg.saveCSS(bg.css[M.cur]);}
	mClose();
};
M.onclose=$('mClose').onclick=function(){
	if(M.dirty) {
		var e=confirm(_('Modifications are not saved!\nClick OK to discard them or Cancel to stay.'));
		if(!e) return;
	}
	mClose();
};
