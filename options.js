var $=document.querySelector.bind(document),L=$('#sList'),cur=null,C=$('.content'),
		bg=opera.extension.bgProcess,_=bg._,divs={};
function getDate(t){var d=new Date();d.setTime(t);return d.toLocaleDateString();}
function getName(d,n){
	d.title=n||'';
	d.innerHTML=n?n.replace(/&/g,'&amp;').replace(/</g,'&lt;'):'<em>'+_('labelNoName')+'</em>';
}

// Main options
function modifyItem(r){
	var d=divs[r.id],n=bg.metas[r.id];
	if(r.message) d.querySelector('.message').innerHTML=r.message;
	d.className=n.enabled?'':'disabled';
	var a=d.querySelector('.update');
	if(a) a.disabled=r.updating;
	a=d.querySelector('.name');
	if(n.url) a.href=n.url;
	getName(a,n.name);
	a=d.querySelector('.enable');
	a.innerHTML=n.enabled?_('buttonDisable'):_('buttonEnable');
}
function loadItem(n,r){
	var d=divs[n.id];if(!r) r={id:n.id};
	d.innerHTML='<a class="name ellipsis"></a>'
	+'<span class=updated>'+(n.updated?_('labelLastUpdated')+getDate(n.updated):'')+'</span>'
	+'<div class=panel>'
		+'<button data=edit>'+_('buttonEdit')+'</button> '
		+'<button data=enable class=enable></button> '
		+'<button data=remove>'+_('buttonRemove')+'</button> '
		+(n.metaUrl?'<button data=update class=update>'+_('anchorUpdate')+'</button> ':'')
		+'<span class=message></span>'
	+'</div>';
	setTimeout(function(){modifyItem(r);},0);
}
function addItem(o){
	var d=divs[o.id]=document.createElement('div');
	loadItem(o);
	L.appendChild(d);
}
L.onclick=function(e){
	var o=e.target,d=o.getAttribute('data'),p;
	if(!d) return;
	e.preventDefault();
	for(p=o;p&&p.parentNode!=L;p=p.parentNode);
	var i=Array.prototype.indexOf.call(L.childNodes,p);
	switch(d){
		case 'edit':
			bg.getStyle(bg.ids[i],edit);
			break;
		case 'enable':
			var id=bg.ids[i],s=bg.metas[id];
			bg.enableStyle(id,!s.enabled);
			break;
		case 'remove':
			bg.removeStyle(i);
			L.removeChild(p);
			break;
		case 'update':
			bg.checkUpdate(bg.ids[i]);
			break;
	}
};
$('#bNew').onclick=function(){edit(bg.newStyle());};
$('#bUpdate').onclick=bg.checkUpdateAll;
function switchTab(e){
	var t=e.target,i=t.id.slice(2),o=C.querySelector('#tab'+i);
	if(!o) return;
	if(cur) {
		if(cur.tab==o) return;
		cur.menu.classList.remove('selected');
		cur.tab.classList.add('hide');
	}
	cur={menu:t,tab:o};
	t.classList.add('selected');
	o.classList.remove('hide');
	switch(i) {	// init
		case 'Settings':xLoad();break;
	}
}
$('.sidemenu').onclick=switchTab;
switchTab({target:$('#smInstalled')});
function confirmCancel(dirty){
	return !dirty||confirm(_('confirmNotSaved'));
}

// Advanced
$('#cShow').checked=bg.settings.showButton;
$('#cShow').onchange=function(){bg.showButton(bg.setOption('showButton',this.checked));};
$('#aImport').onchange=function(e){
	var i,f,files=e.target.files;
	for(i=0;f=files[i];i++) {
		var r=new FileReader();
		r.onload=function(e){impo(e.target.result);};
		r.readAsBinaryString(f);
	}
};
function impo(b){
	function finish(){
		if(!--count) {
			alert(_('msgImported',[n]));
			location.reload();
		}
	}
	var z=new JSZip(),count=0,n=0;
	try{z.load(b);}catch(e){alert(_('msgErrorZip'));return;}
	[[/\.json$/,bg.parseJSON],[/\.user\.css$/,bg.parseFirefoxCSS]].forEach(function(i){
		z.file(i[0]).forEach(function(o){
			if(o.dir) return;
			count++;
			try{
				i[1](null,{code:o.asText()},function(r){if(r.status>=0) n++;finish();});
			}catch(e){
				opera.postError('Error importing data: '+o.name+'\n'+e);
				finish();
			}
		});
	});
	var f=z.file('Stylish');
	if(f) try{f=JSON.parse(f.asText());}catch(e){f={};opera.postError('Error parsing Stylish configuration.');}
	if(f.settings) for(z in f.settings)
		if(z in bg.settings) bg.setOption(z,f.settings[z]);
}

// Export
var xL=$('#xList'),xE=$('#bExport'),xF=$('#cFirefox');
function xLoad() {
	xL.innerHTML='';xE.disabled=false;
	xF.checked=bg.settings.firefoxCSS;
	bg.ids.forEach(function(i){
		var d=document.createElement('div');
		d.className='ellipsis';
		getName(d,bg.metas[i].name);
		xL.appendChild(d);
	});
}
xF.parentNode.title=_('hintFirefoxCSS');
xF.onchange=function(){bg.setOption('firefoxCSS',this.checked);};
xL.onclick=function(e){
	var t=e.target;
	if(t.parentNode!=this) return;
	t.classList.toggle('selected');
};
$('#bSelect').onclick=function(){
	var c=xL.childNodes,v,i;
	for(i=0;i<c.length;i++) if(!c[i].classList.contains('selected')) break;
	v=i<c.length;
	for(i=0;i<c.length;i++) if(v) c[i].classList.add('selected'); else c[i].classList.remove('selected');
};
function getFirefoxCSS(c){
	var d=[];
	['id','name','url','metaUrl','updateUrl','updated','enabled'].forEach(function(i){
		if(c[i]!=undefined) d.push('/* @'+i+' '+String(c[i]).replace(/\*/g,'+')+' */');
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
xE.onclick=function(){
	this.disabled=true;this.innerHTML=_('buttonExporting');
	var i,ids=[];
	for(i=0;i<bg.ids.length;i++) if(xL.childNodes[i].classList.contains('selected')) ids.push(bg.ids[i]);
	bg.getStyles(ids,function(o){
		var z=new JSZip(),names={},o;
		o.forEach(function(c){
			var n=c.name||'Noname',m=n;i=0;
			while(names[n]) n=m+(++i);names[n]=1;
			if(xF.checked) z.file(n+'.user.css',getFirefoxCSS(c));
			else z.file(n+'.json',JSON.stringify(c));
		});
		z.file('Stylish',JSON.stringify({settings:bg.settings}));
		i={compression:'DEFLATE'};
		o=z.generate(i);
		bg.opera.extension.tabs.create({url:'data:application/zip;base64,'+o}).focus();
	});
};

// Style Editor
var M=$('#wndEditor'),S=$('#mSection'),I=$('#mName'),
    rD=$('#mDomain'),rR=$('#mRegexp'),rP=$('#mUrlPrefix'),rU=$('#mUrl'),
    eS=$('#mSave'),eSC=$('#mSaveClose'),T;
function edit(o){
	M.classList.remove('hide');
	M.css=o;M.data=o.data;
	S.innerHTML='';S.cur=0;S.dirty=false;
	eS.disabled=eSC.disabled=true;
	I.value=o.name;
	if(M.data.length) {
		for(var i=0;i<M.data.length;i++) mAddItem(M.data[i].name);
		mShow();
	} else addSection();
}
function mAddItem(n){
	var d=document.createElement('div');
	S.appendChild(d);
	d.innerText=n||S.childNodes.length;
	return d;
}
function split(t){return t.replace(/^\s+|\s+$/g,'').split(/\s*\n\s*/).filter(function(e){return e;});}
function mSection(r){
	if(M.data[S.cur]){
		if(S.dirty){
			S.dirty=false;
			M.data[S.cur].domains=split(rD.value);
			M.data[S.cur].regexps=split(rR.value);
			M.data[S.cur].urlPrefixes=split(rP.value);
			M.data[S.cur].urls=split(rU.value);
			M.data[S.cur].code=T.getValue();T.clearHistory();
		}
		if(r) S.childNodes[S.cur].classList.remove('selected');
	}
}
function mSave(){
	M.css.name=I.value;
	mSection();
	eS.disabled=eSC.disabled=true;
	bg.saveStyle(M.css,{status:M.css.id?0:1});
}
function mShow(){
	var c=S.childNodes[S.cur];S.dirty=true;
	if(c) {
		S.childNodes[S.cur].classList.add('selected');
		rD.value=M.data[S.cur].domains.join('\n');
		rR.value=M.data[S.cur].regexps.join('\n');
		rP.value=M.data[S.cur].urlPrefixes.join('\n');
		rU.value=M.data[S.cur].urls.join('\n');
		T.setValueAndFocus(M.data[S.cur].code);
	} else T.setValueAndFocus(rD.value=rR.value=rP.value=rU.value='');
	T.clearHistory();S.dirty=false;
}
function mClose(){M.classList.add('hide');M.css=null;}
function bindChange(e,f){e.forEach(function(i){i.onchange=f;});}
M.markDirty=function(){eS.disabled=eSC.disabled=false;};
S.markDirty=function(){if(S.dirty) return;S.dirty=true;M.markDirty();};
bindChange([rD,rR,rP,rU],S.markDirty);
bindChange([I],M.markDirty);
S.onclick=function(e){
	var t=e.target;
	if(t.parentNode!=this) return;
	if(!t.classList.contains('selected')) {
		mSection(1);
		S.cur=Array.prototype.indexOf.call(S.childNodes,t);
		mShow();
	} else renameSection(t);
};
function addSection(){
	var d={name:'',domains:[],regexps:[],urlPrefixes:[],urls:[],code:''};
	mSection(1);
	S.cur=M.data.length;
	M.data.push(d);
	mAddItem();
	mShow();
}
function renameSection(t){
	if(!t) return;
	var o=prompt(_('msgRename',[t.innerText]));
	if(o!=null) {
		M.data[S.cur].name=o;
		t.innerText=o||S.cur+1;
		M.markDirty();
	}
}
$('#mNew').onclick=addSection;
$('#mDel').onclick=function(){
	if(M.data.length>1) {
		M.data.splice(S.cur,1);
		S.removeChild(S.lastChild);
		for(var i=S.cur;i<M.data.length;i++) {
			S.childNodes[i].innerText=M.data[i].name||i+1;
		}
		if(S.cur==M.data.length) S.cur--;
		M.markDirty();mShow();
	}
};
$('#mRen').onclick=function(){
	renameSection(S.childNodes[S.cur]);
};
eS.onclick=mSave;
eSC.onclick=function(){mSave();mClose();};
M.close=$('#mClose').onclick=function(){if(confirmCancel(!eS.disabled)) mClose();};
function ruleFocus(e){e.target.parentNode.style.width='50%';}
function ruleBlur(e){e.target.parentNode.style.width='';}
[rD,rR,rP,rU].forEach(function(i){i.onfocus=ruleFocus;i.onblur=ruleBlur;});
initEditor(function(o){T=o;},{onchange:S.markDirty});

// Load at last
(function(nodes){
	for(var i=0;i<nodes.length;i++) nodes[i].innerHTML=_(nodes[i].getAttribute('data-i18n'));
})(document.querySelectorAll('*[data-i18n]'));
L.innerHTML='';
bg.ids.forEach(function(i){addItem(bg.metas[i]);});
function updateItem(r){
	if(!('id' in r)) return;
	var m=bg.metas[r.id];
	switch(r.status){
		case 0:loadItem(m,r);break;
		case 1:addItem(m);break;
		default:modifyItem(r);
	}
}
bg._updateItem.push(updateItem);
