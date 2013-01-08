Stylish-for-Opera
=================
Introduction
-----------------
Stylish facilitates modification of the way websites look. This extension lets you manage custom styles and install styles from <http://userstyles.org> on Opera.

Features
-----------------
1. Install stylesheets from <http://userstyles.org>.
1. Check and apply updates from <http://userstyles.org>.<br>*Updates for styles with options will not be fetched since the options may change. Instead, a hint will be showed.*
1. Remove *-moz-* and *-webkit-* prefixes while applying CSS.
1. Export to a zip file with *.user.css* files inside.
1. Install *.user.css* files (as exported).
1. Match URLs according to four types of rules: *domain* / *regexp* / *url-prefix* / *url*. <a href=#faq_match>(?)</a>

FAQ
-----------------
1. **How is the efficiency?**<br>The extension works not so efficiently since all the rules have to be tested for each page. Consequently, it may be unexpectedly slow when there are TOO many rules.

1. <a name=faq_store></a>**Where is the data stored?**<br>Since extensions of Opera do not have the permission to read or write files in local drives, all the data are stored in the extension storage. CSS files can be exported since version 1.3.

1. <a name=faq_match></a>**What are the matching rules?**<br>There are four types of rules. (One per line)
 * **domain**: matches a domain and all of its subdomains.
 * **regexp**: parsed as a regular-expression and then test the URL.
 * **url-prefix**: matches the URLs that exactly starts with the rule text.
 * **url**: matches the URL that is exactly the same as the rule text.

 If any one of the rules matches the URL of current page, the CSS code will be applied.

 Excluding rules are removed to keep up with official Stylish. If you have any questions or suggestions, please contact <http://userstyles.org> directly.

1. <a name=faq_section></a>**Why are CSS separated into sections?**<br>Since *@document* rules are discarded by the standards and only supported by Firefox now, Opera itself will not apply CSS according to the rules. So it is easier for Stylish for Opera to manage and apply CSS stored in sections. Since version 1.3, CSS can be exported into a zip file with *.user.css* files inside, of which the sections are integrated again into a *@-moz-document* format.

Preview release (2013-1-4): <https://skydrive.live.com/redir?resid=9F63DC97688A095E!611>

Author: Gerald &lt;<gera2ld@163.com>&gt;
