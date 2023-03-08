if (
  [5400, 9000].includes(parseInt(window.location.port)) ||
  window.location.host === "walhalla.inwork.nl"
) {
  import(chrome.runtime.getURL("/lib/monkey-script.js")).then(
    async (Monkey) => {
      Monkey.js(() => {
        const orgSetInterval = setInterval;
        setInterval = (fun, delay) => {
          if (delay === 30000) return;
          return orgSetInterval(fun, delay);
        };
      });
    }
  );
}
