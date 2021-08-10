import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  Monkey.css(`.cxsrecField .disabledDateInput {
    pointer-events: auto !important;
  }`);
});
