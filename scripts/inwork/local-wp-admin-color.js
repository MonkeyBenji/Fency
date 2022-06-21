import(chrome.runtime.getURL("/lib/monkey-script.js")).then((Monkey) => {
  Monkey.css(`#wpadminbar {
  background-color: #9bcb41;
}`);
});
