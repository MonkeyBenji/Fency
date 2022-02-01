import(chrome.runtime.getURL("/lib/monkey-script.js")).then((Monkey) => {
  Monkey.css(`
* {
  text-transform: uppercase !important;
}`);
});
