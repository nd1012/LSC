# LSC inspector

This addon can help to inspect a website, if it's suitable for using LSC. The addon will try to find issues that may cause LSC making problems, when used with a website.


## Usage

Open a browser (I recommend to use Google Chrome) and navigate to the website that you want to inspect for using LSC. Then open the developer tools (in Google Chrome `Shift+Ctrl+I`) and enter these commands in the JavaScript console tab:

```js
var script=document.createElement('script');
script.src='https://cdn.jsdelivr.net/gh/nd1012/LSC/add-ons/inspect/lscinspector.js';
document.querySelector('head').appendChild(script);
await LSCInspector.run();
```

This will run some tests and output the results to the console. In the best case you should see only this message:

	www.yourdomain.tld may be good for running with LSC

The script will raise a warning on possible problems and errors on errors. However, the script should not fail to run.

If the website runs LSC already, the running instance will be tested, too. The script will raise a warning, because the `LSC` global was defined already - but you can ignore that, since in this case `LSC` hosts the JavaScript `localStorage` Cache, which is as it should be.
