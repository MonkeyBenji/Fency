import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  Monkey.css(`
Body.DocCtrl .v-dialog__content:has(.login-container),
Body.DocCtrl .v-overlay {
  display: none;
}`);
});
