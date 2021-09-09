import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  Monkey.css(`body {
    transform: rotate(180deg);
  }`);
  document.body.scrollIntoView({ block: "end" });
});
