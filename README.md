Stylish-for-Opera
=================
<h3>Introduction</h3>
<p>Stylish is a very popular extension for Firefox and Chrome since it facilitates modification of the way websites look. However, the official version works only on Firefox and Chrome. This extension makes it possible to use styles from <a href=http://userstyles.org/ target=_blank>UserStyles.org</a> on Opera.</p>
<h3>Features</h3>
<ol>
<li>Stylesheets from UserStyles.org can be used.</li>
<li>Checking and applying updates from UserStyles.org is allowed.<br><em>However, updates for styles with options will not be fetched since the options may change. Instead, a hint will be showed.</em></li>
<li>Removing -moz- and -webkit- prefixes while applying CSS is supported.</li>
<li>Export to a zip file with .user.css files inside.</li>
<li>Allow installing .user.css files (as exported).</li>
<li>Matching rules have been changed to four types: domain/regexp/url-prefix/url. <a href=#faq_match style="color:purple">FAQ</a></li>
</ol>
<h3>FAQ</h3><ol>
<li><b>How is the efficiency?</b><p>The extension works not so efficiently since all the rules have to be tested for each page. Consequently, it may be unexpectedly slow when there are TOO many rules.</p></li>
<li><a name=faq_store></a><b>Where is the data stored?</b><p>Since extensions of Opera do not have the permission to read or write files in local drives, all the data are stored in the extension storage. CSS files can be exported since version 1.3.</p></li>
<li><a name=faq_match></a><b>What are the matching rules?</b><p>There are four types of rules. (One rule per line)</p>
<ul><li><font color=dodgerblue>domain</font>: matches a domain and all of its subdomains.</li><li><font color=dodgerblue>regexp</font>: parsed as a regular-expression and then test the URL.</li><li><font color=dodgerblue>url-prefix</font>: matches the URLs that exactly starts with the rule text.</li><li><font color=dodgerblue>url</font>: matches the URL that is exactly the same as the rule text.</li></ul><p>If any one of the rules matches the URL of current page, the CSS code will be applied.</p></li>
<li><a name=faq_section></a><b>Why are CSS separated into sections?</b><p>Since <i>@document</i> rules are discarded by the standards and only supported by Firefox now, Opera itself will not apply CSS according to the rules. So it is easier for Stylish for Opera to manage and apply CSS stored in sections. After version 1.3, CSS can be exported into a zip file with .user.css files inside, of which the sections are integrated again into a Stylish format.</p></li>
</ol>
<p>Support page: http://my.opera.com/gera2ld/blog/2012/12/09/stylish-for-opera</p>
<p>Author: Gerald &lt;gera2ld&#x40;myopera.com&gt;</p>
