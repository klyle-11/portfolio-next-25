---
title: react.js markdown
description: cross site scripting (XSS), formatting, css
date: 05/23/2021
---

### What is dangerouslySetInnerHTML?
#### *from React.js docs*
dangerouslySetInnerHTML is React’s replacement for using innerHTML in the browser DOM. In general, setting HTML from code is risky because it’s easy to inadvertently expose your users to a **cross-site scripting (XSS)** attack. So, you can set HTML directly from React, but you have to type out dangerouslySetInnerHTML and pass an object with a __html key, to remind yourself that it’s dangerous. For example:

```javascript
function createMarkup() {
  return {__html: 'First &middot; Second'};
}

function MyComponent() {
  return <div dangerouslySetInnerHTML={createMarkup()} />;
}
```
### what's the risk?
**from Wikipedia**  
Cross-site scripting (XSS) is a type of security vulnerability typically found in web applications. XSS attacks enable attackers to inject client-side scripts into web pages viewed by other users. A cross-site scripting vulnerability may be used by attackers to bypass access controls such as the same-origin policy. Cross-site scripting carried out on websites accounted for roughly 84% of all security vulnerabilities documented by Symantec up until 2007.[1] XSS effects vary in range from petty nuisance to significant security risk, depending on the sensitivity of the data handled by the vulnerable site and the nature of any security mitigation implemented by the site's owner network.

### Latest fix - [DOMPurify](https://github.com/cure53/DOMPurify)
#### *from Marked docs*
```
{
    member: sanitize, 
    type: boolean, 
    default: false, 
    Since: v.0.2.1, 
    Notes: "
        If true, sanitize the HTML passed into markdownString with the sanitizer function.
        Warning: This feature is deprecated and it should NOT be used as it cannot be considered secure.
        Instead use a sanitize library, like DOMPurify (recommended), sanitize-html or insane on the output HTML!
    " 
    }
    ```
If true, sanitize the HTML passed into markdownString with the sanitizer function.
Warning: This feature is deprecated and it should NOT be used as it cannot be considered secure.
Instead use a sanitize library, like DOMPurify (recommended), sanitize-html or insane on the output HTML!

