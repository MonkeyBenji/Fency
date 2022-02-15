if (
  window.location.port == 9000 ||
  window.location.host === "walhalla.inwork.nl"
) {
  import(chrome.runtime.getURL("/lib/monkey-script.js")).then(
    async (Monkey) => {
      Monkey.js(() => {
        setInterval = () => {};
      });
    }
  );
}
