import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  Monkey.waitForSelector("#modal-search-input")
    .then((input) => {
      setTimeout(() => {
        input.focus();
        input.value = "[iw]";
        Monkey.type(" ");
      }, 500);
    })
    .catch(() => {});
});
