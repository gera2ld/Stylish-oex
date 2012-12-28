function $(i){return document.getElementById(i);}
var bg=opera.extension.bgProcess,P=$('popup'),_=bg.getI18nString,
	tab=bg.opera.extension.tabs.getFocused(),cL=[];
function loadItem(d,c,b){
	if(c) d.classList.remove('disabled');
	else d.classList.add('disabled');
	if(!b) bg.opera.extension.broadcastMessage({topic:'LoadCSS'});
}
function addItem(h,t,c){
	var d=document.createElement('label'),s='';
	if('data' in c) s+='<input type=checkbox>'; else s+='<span>>></span>';
	d.innerHTML=s+h;
	if(t) {if(typeof t!='string') t=h;d.title=t;}
	d.className='ellipsis';
	P.appendChild(d);
	if('data' in c){
		loadItem(d,c.data,true);
		d.firstChild.checked=!!c.data;
		delete c.data;
		d.firstChild.onchange=c.onchange;
		delete c.onchange;
	}
	for(s in c) d[s]=c[s];
}
function menuStyle(i){
	var n=i.name||'('+_('Null')+')';
	addItem(n.replace(/&/g,'&amp;').replace(/</g,'&lt;'),n,{data:i.enabled,onchange:function(){
		loadItem(this.parentNode,i.enabled=this.checked);bg.saveCSS();
	}});
}
(function(){
	addItem(_('Manage styles'),true,{onclick:function(){
		bg.opera.extension.tabs.create({url:'/options.html'}).focus();
	}});
	if(tab.port) addItem(_('Search styles for this site'),true,{onclick:function(){
		bg.opera.extension.tabs.create({url:'http://userstyles.org/styles/search/'+encodeURIComponent(tab.url)}).focus();
	}});
	addItem(_('Enable styles'),true,{data:bg.isApplied,onchange:function(){
		loadItem(this.parentNode,bg.saveSetting('isApplied',bg.isApplied=this.checked));bg.updateIcon();
	}});
	P.appendChild(document.createElement('hr'));
	var n=0;
	if(tab.port) bg.css.forEach(function(i){if(bg.testURL(tab.url,i)){menuStyle(i);n=1;}});
	if(!n) addItem('<em>'+_('Null')+'</em>',_('Null'),{className:'hint'});
	bg.button.popup.height=document.body.offsetHeight;
})();
