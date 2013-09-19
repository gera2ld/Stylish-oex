function initAce(callback,data){
	data=data||{};
	addScript({src:'lib/ace-min-noconflict/ace.js'},function(){
		var T=ace.edit('mCode'),s=T.getSession();
		T.setValueAndFocus=function(v){
			T.setValue(v);T.focus();T.gotoLine(0,0);
		};
		s.setMode('ace/mode/css');
		s.setUseSoftTabs(false);
		s.setUseWrapMode(true);
		s.setUseWorker(true);
		T.clearHistory=s.getUndoManager().reset;
		if(data.onchange) s.on('change',data.onchange);
		if(data.readonly) T.setReadOnly(data.readonly);
		callback(T);
	});
}

function initCodeMirror(callback,data){
	data=data||{};
	addCSS([
		{href:'lib/CodeMirror/lib/codemirror.css'},
	]);
	addScript({src:'lib/CodeMirror/lib/codemirror.js'},function(){
		addScript([
			{src:'lib/CodeMirror/mode/css/css.js'},
			{src:'lib/CodeMirror/addon/comment/continuecomment.js'},
			{src:'lib/CodeMirror/addon/edit/matchbrackets.js'},
			{src:'lib/CodeMirror/addon/search/match-highlighter.js'},
			{src:'lib/CodeMirror/addon/search/search.js'},
			{src:'lib/CodeMirror/addon/search/searchcursor.js'},
			{src:'lib/CodeMirror/addon/selection/active-line.js'},
		],function(){
			var T=CodeMirror($('mCode'),{
				lineNumbers:true,
				matchBrackets:true,
				mode:'text/css',
				lineWrapping:true,
				indentUnit:4,
				indentWithTabs:true,
				extraKeys:{"Enter":"newlineAndIndentContinueComment"},
				styleActiveLine:true,
			});
			T.clearHistory=function(){T.getDoc().clearHistory();};
			T.setValueAndFocus=function(v){T.setValue(v);T.focus();};
			T.getWrapperElement().setAttribute('style','position:absolute;height:100%;width:100%;');
			if(data.onchange) T.on('change',data.onchange);
			if(data.readonly) T.setOption('readOnly',data.readonly);
			callback(T);
		});
	});
}

var initEditor=initAce;
