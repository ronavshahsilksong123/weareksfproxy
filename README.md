<h2>KSF Web Proxy</h2>

<h3>Features:</h3>
 
-4,000 games
 
-Uses ultraviolet, a fast and secure proxy

-Clean UI

-Browser with multiple tabs, back/forwards arrows, reload button, search/url bar, cloak in about:blank page in new tab, and fullscreen

# How to change the password and add your own groq api key

go to index.js (not in public folder) and find  
```js
const SITE_PASSWORD = "enter_password_here";
const groq_api      = "enter_api_here";
```
replace them with your custom passowrd and your api.



<h3>NOTE: Default port is 8080, you may have to change it with an environment variable depending on how you are hosting it.</h3>

Based on FalconLink
