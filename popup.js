function $(i){return document.getElementById(i);}
var bg=opera.extension.bgProcess,P=$('popup'),A=$('astyles'),
    pT=P.querySelector('.top'),pB=P.querySelector('.bot'),
    aT=A.querySelector('.top'),aB=A.querySelector('.bot'),
    _=bg.getI18nString,tab=bg.opera.extension.tabs.getFocused(),cL=[];
function loadItem(d,c){
	if(c) {
		d.firstChild.innerText=d.symbol;
		d.classList.remove('disabled');
	} else {
		d.firstChild.innerText='';
		d.classList.add('disabled');
	}
}
function addItem(h,t,c){
	var d=document.createElement('div'),s;
	d.innerHTML='<span></span>'+h;
	if(t) {if(typeof t!='string') t=h;d.title=t;}
	d.className='ellipsis';
	c.holder.appendChild(d);
	if('symbol' in c) d.firstChild.innerText=c.symbol;
	else if('data' in c) c.symbol='✓';
	for(s in c) d[s]=c[s];
	if('data' in c) loadItem(d,c.data);
	return d;
}
function menuStyle(i){
	var n=i.name?i.name.replace(/&/g,'&amp;').replace(/</g,'&lt;'):'<em>'+_('Null name')+'</em>';
	addItem(n,i.name,{holder:pB,data:i.enabled,onclick:function(){
		loadItem(this,i.enabled=!i.enabled);bg.saveScript(i);
	}});
}
var cur=null,_title;
function alterStyle(i){
	var d=addItem(i,true,{holder:aB,data:i==_title,onclick:function(){
		if(cur) loadItem(cur,false);loadItem(cur=this,true);
		try{tab.postMessage({topic:'AlterStyle',data:i});}catch(e){}
	}});
	if(i==_title) cur=d;
}
function load(e,data){
	addItem(_('Manage styles'),true,{holder:pT,symbol:'➤',onclick:function(){
		var t=bg.opera.extension.tabs.create({url:'/options.html'});
		if(t.focus) t.focus();	// Opera 12+ Only
	}});
	if(data) addItem(_('Find styles for this site'),true,{holder:pT,symbol:'➤',onclick:function(){
		var t=bg.opera.extension.tabs.create({url:'http://userstyles.org/styles/search/'+encodeURIComponent(tab.url)});
		if(t.focus) t.focus();	// Opera 12+ Only
	}});
	if(data&&data.astyles&&data.astyles.length) {
		_title=data.cstyle||'';
		addItem(_('Back'),true,{holder:aT,symbol:'◄',onclick:function(){
			A.classList.add('hide');P.classList.remove('hide');
			bg.button.popup.height=P.offsetHeight;
		}});
		aT.appendChild(document.createElement('hr'));
		data.astyles.forEach(alterStyle);
		addItem(_('Alter stylesheet...'),true,{holder:pT,symbol:'➤',onclick:function(){
			P.classList.add('hide');A.classList.remove('hide');
			bg.button.popup.height=A.offsetHeight;
			setTimeout(function(){aB.style.pixelHeight=innerHeight-aB.offsetTop;},0);
		}});
	}
	addItem(_('Enable styles'),true,{holder:pT,data:bg.isApplied,onclick:function(){
		bg.setItem('isApplied',bg.isApplied=!bg.isApplied);bg.updateIcon();loadItem(this,bg.isApplied);
		bg.opera.extension.broadcastMessage({topic:'LoadedStyle',data:{isApplied:bg.isApplied}});
	}});
	if(data&&data.styles&&data.styles.length) {
		pT.appendChild(document.createElement('hr'));
		data.styles.forEach(function(i){menuStyle(bg.map[i]);});
	}
	bg.button.popup.height=P.offsetHeight;
	setTimeout(function(){pB.style.pixelHeight=innerHeight-pB.offsetTop;},0);
}
bg.messages['GotPopup']=load;
try{tab.postMessage({topic:'GetPopup'});}catch(e){load();}
