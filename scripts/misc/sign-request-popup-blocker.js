import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  Monkey.css(`
.v-dialog__content:has(.login-container),
.v-overlay {
  display: none;
}`);
});
