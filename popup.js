function $(i){return document.getElementById(i);}
var bg=opera.extension.bgProcess,P=$('popup'),_=bg.getI18nString,
	tab=bg.opera.extension.tabs.getFocused(),cL=[];
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
	P.appendChild(d);
	if('symbol' in c) d.firstChild.innerText=c.symbol;
	else if('data' in c) c.symbol='✓';
	for(s in c) d[s]=c[s];
	if('data' in c) loadItem(d,c.data);
}
function menuStyle(i){
	var n=i.name||'('+_('Null name')+')';
	addItem(n.replace(/&/g,'&amp;').replace(/</g,'&lt;'),n,{data:i.enabled,onclick:function(){
		loadItem(this,i.enabled=!i.enabled);bg.saveCSS(i);
	}});
}
function load(e,data){
	addItem(_('Manage styles'),true,{symbol:'>>',onclick:function(){
		bg.opera.extension.tabs.create({url:'/options.html'}).focus();
	}});
	if(data) addItem(_('Find styles for this site'),true,{symbol:'>>',onclick:function(){
		bg.opera.extension.tabs.create({url:'http://userstyles.org/styles/search/'+encodeURIComponent(tab.url)}).focus();
	}});
	addItem(_('Enable styles'),true,{data:bg.isApplied,onclick:function(){
		bg.saveSetting('isApplied',bg.isApplied=!bg.isApplied);bg.updateIcon();loadItem(this,bg.isApplied);
		bg.opera.extension.broadcastMessage({topic:'LoadedCSS',data:{isApplied:bg.isApplied}});
	}});
	if(data&&data.length) {
		P.appendChild(document.createElement('hr'));
		data.forEach(function(i){menuStyle(bg.map[i]);});
	}
	bg.button.popup.height=document.body.offsetHeight;
}
if(tab.port) {
	bg.messages['GotPopup']=load;
	tab.postMessage({topic:'GetPopup'}); 
} else load();
