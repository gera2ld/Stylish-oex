function $(i){return document.getElementById(i);}
var bg=opera.extension.bgProcess,P=$('popup'),_=bg.getI18nString,
	tab=bg.opera.extension.tabs.getFocused(),cL=[];
function loadItem(d,c,b){
	if(c) {
		d.firstChild.innerText=d.symbol;
		d.classList.remove('disabled');
	} else {
		d.firstChild.innerText='';
		d.classList.add('disabled');
	}
	if(!b) bg.opera.extension.broadcastMessage({topic:'LoadCSS'});
}
function addItem(h,t,c){
	var d=document.createElement('div'),s;
	d.innerHTML='<span></span>'+h;
	if(t) {if(typeof t!='string') t=h;d.title=t;}
	d.className='ellipsis';
	P.appendChild(d);
	if('symbol' in c) d.firstChild.innerText=c.symbol;
	else if('data' in c) c.symbol='✓';
	for(s in c) d[s]=c[s];
	if('data' in c) loadItem(d,c.data,true);
}
function menuStyle(i){
	var n=i.name||'('+_('Null')+')';
	addItem(n.replace(/&/g,'&amp;').replace(/</g,'&lt;'),n,{data:i.enabled,onclick:function(){
		loadItem(this,i.enabled=!i.enabled);bg.saveCSS();
	}});
}
(function(){
	addItem(_('Manage styles'),true,{symbol:'>>',onclick:function(){
		bg.opera.extension.tabs.create({url:'/options.html'}).focus();
	}});
	if(tab.port) addItem(_('Search styles for this site'),true,{symbol:'>>',onclick:function(){
		bg.opera.extension.tabs.create({url:'http://userstyles.org/styles/search/'+encodeURIComponent(tab.url)}).focus();
	}});
	addItem(_('Enable styles'),true,{data:bg.isApplied,onclick:function(){
		loadItem(this,bg.saveSetting('isApplied',bg.isApplied=!bg.isApplied));bg.updateIcon();
	}});
	P.appendChild(document.createElement('hr'));
	var n=0;
	if(tab.port) bg.css.forEach(function(i){if(bg.testURL(tab.url,i)){menuStyle(i);n=1;}});
	if(!n) addItem('<em>'+_('Null')+'</em>',_('Null'),{className:'disabled'});
	bg.button.popup.height=document.body.offsetHeight;
})();
