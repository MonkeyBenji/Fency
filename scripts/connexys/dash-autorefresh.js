import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  Monkey.waitForSelector(".lastRefreshDetail .slds-icon-text-warning")
    .then(async () => {
      const refresh = await Monkey.waitForSelector("button.refresh:enabled");
      refresh.click();
    })
    .catch(() => {});
});
