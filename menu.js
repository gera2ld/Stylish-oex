var $=document.getElementById.bind(document),P=$('popup'),A=$('astyles'),
    pT=P.querySelector('.top'),pB=P.querySelector('.bot'),
    aT=A.querySelector('.top'),aB=A.querySelector('.bot'),
    bg=opera.extension.bgProcess,_=bg._,
		tab=bg.opera.extension.tabs.getFocused(),ia=null;
function loadItem(d,c){
	if(c) {
		d.firstChild.innerText=d.symbol;
		d.classList.remove('disabled');
	} else {
		d.firstChild.innerText='';
		d.classList.add('disabled');
	}
}
function addItem(h,c,b){
	var d=document.createElement('div');
	d.innerHTML='<span></span>'+h;
	if('title' in c) {
		d.title=typeof c.title=='string'?c.title:h;
		delete c.title;
	}
	d.className='ellipsis';
	c.holder.insertBefore(d,b);
	if('symbol' in c) d.firstChild.innerText=c.symbol;
	else if('data' in c) c.symbol='✓';
	for(h in c) d[h]=c[h];
	if('data' in c) loadItem(d,c.data);
	return d;
}
function menuStyle(i){
	var n,d;
	n=i.name?i.name.replace(/&/g,'&amp;').replace(/</g,'&lt;'):'<em>'+_('labelNoName')+'</em>';
	d=addItem(n,{holder:pB,data:i.enabled,title:i.name,onclick:function(){
		bg.enableStyle(i.id,!i.enabled,function(){loadItem(d,i.enabled);});
	}});
}
var cur=null,_title;
function alterStyle(i){
	var d=addItem(i,{holder:aB,data:i==_title,title:true,onclick:function(){
		if(cur) loadItem(cur,false);loadItem(cur=this,true);
		try{tab.postMessage({topic:'AlterStyle',data:i});}catch(e){}
	}});
	if(i==_title) cur=d;
}
function initMenu(){
	addItem(_('menuManageStyles'),{holder:pT,symbol:'➤',title:true,onclick:function(){
		bg.opera.extension.tabs.create({url:'/options.html'}).focus();
	}});
  if(/^https?:\/\//i.test(tab.url))
		addItem(_('menuFindStyles'),{holder:pT,symbol:'➤',title:true,onclick:function(){
			bg.opera.extension.tabs.create({url:'http://userstyles.org/styles/search/'+encodeURIComponent(tab.url)}).focus();
		}});
	ia=addItem(_('menuStylesEnabled'),{holder:pT,data:bg.settings.isApplied,title:true,onclick:function(){
		loadItem(this,bg.setOption('isApplied',!bg.settings.isApplied));bg.updateIcon();
		bg.opera.extension.broadcastMessage({topic:'LoadedStyle',data:{isApplied:bg.settings.isApplied}});
	}});
}
function load(e,data){
	if(data&&data.astyles&&data.astyles.length) {
		_title=data.cstyle||'';
		addItem(_('menuBack'),{holder:aT,symbol:'◄',title:true,onclick:function(){
			A.classList.add('hide');P.classList.remove('hide');
			bg.button.popup.height=P.offsetHeight;
		}});
		aT.appendChild(document.createElement('hr'));
		data.astyles.forEach(alterStyle);
		addItem(_('menuAlterStylesheet'),{holder:pT,symbol:'➤',title:true,onclick:function(){
			P.classList.add('hide');A.classList.remove('hide');
			bg.button.popup.height=A.offsetHeight;
			setTimeout(function(){aB.style.pixelHeight=innerHeight-aB.offsetTop;},0);
		}},ia);
	}
	if(data&&data.styles&&data.styles.length) {
		pT.appendChild(document.createElement('hr'));
		data.styles.forEach(function(i){menuStyle(bg.metas[i]);});
	}
	bg.button.popup.height=P.offsetHeight;
	setTimeout(function(){pB.style.pixelHeight=innerHeight-pB.offsetTop;},0);
}
initMenu();bg.maps['GotPopup']=load;
try{tab.postMessage({topic:'GetPopup'});}catch(e){load();}
