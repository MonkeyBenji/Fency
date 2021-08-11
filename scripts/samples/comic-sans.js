import(chrome.runtime.getURL("/lib/monkey-script.js")).then((Monkey) => {
  Monkey.css(`
*:not(.fa):not(.fas):not(.et-pb-icon):not(.ab-icon) {
  font-family: "Comic Sans MS" !important;
}`);
});
