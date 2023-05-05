import(chrome.runtime.getURL("/lib/monkey-script.js")).then((Monkey) => {
  Monkey.css(`
html {
  overflow-y: scroll !important;
  margin-right: 0 !important;
}
#layers > div:nth-of-type(2) div[role="dialog"] {
  display: none;
}
`);
});
