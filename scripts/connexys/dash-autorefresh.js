import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  Monkey.waitForSelector(".lastRefreshDetail .slds-icon-text-warning")
    .then(async (warning) => {
      // const dashboard = warning.closest(".dashboard");
      // const refresh = dashboard.querySelector("button.refresh");
      const refresh = await Monkey.waitForSelector("button.refresh:enabled");
      console.log("Refreshing dashboard", refresh);
      refresh.click();
    })
    .catch(() => console.log("Dashboard up-to-date"));
});
