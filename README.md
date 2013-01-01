Stylish-for-Opera
=================
Introduction

Stylish is a very popular extension for Firefox and Chrome since it facilitates modification of the way websites look. However, the official version works only on Firefox and Chrome. This extension makes it possible to use styles from UserStyles.org on Opera.


Features

1. Stylesheets from UserStyles.org can be used.
2. Checking and applying updates from UserStyles.org is allowed.
  However, updates for styles with options will not be fetched since the options may change. Instead, a hint will be showed. 
3. Removing -moz- and -webkit- prefixes while applying CSS is supported.
4. Export to a zip file with .user.css files inside.
5. Allow installing .user.css files (as exported).
6. Matching rules have been changed to four types: domain/regexp/url-prefix/url. FAQ 

FAQ

1. How is the efficiency?
  The extension works not so efficiently since all the rules have to be tested for each page. Consequently, it may be unexpectedly slow when there are TOO many rules.

2. Where is the data stored?
  Since extensions of Opera do not have the permission to read or write files in local drives, all the data are stored in the extension storage. CSS files can be exported since version 1.3.

3. What are the matching rules?
  There are four types of rules. (One rule per line)
  (1) domain: matches a domain and all of its subdomains.
  (2) regexp: parsed as a regular-expression and then test the URL.
  (3) url-prefix: matches the URLs that exactly starts with the rule text.
  (4) url: matches the URL that is exactly the same as the rule text.
  If any one of the rules matches the URL of current page, the CSS code will be applied.

4. Why are CSS separated into sections?
  Since @document rules are discarded by the standards and only supported by Firefox now, Opera itself will not apply CSS according to the rules. So it is easier for Stylish for Opera to manage and apply CSS stored in sections. After version 1.3, CSS can be exported into a zip file with .user.css files inside, of which the sections are integrated again into a Stylish format.

Support page: http://my.opera.com/gera2ld/blog/2012/12/09/stylish-for-opera
Author: Gerald <gera2ld@myopera.com>
