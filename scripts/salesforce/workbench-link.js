import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  await Monkey.waitForSelector(".slds-global-actions");
  Monkey.js(async () => {
    try {
      const globalActions = document.querySelector(".slds-global-actions");
      const [id, action] = window.location.href.split("/").slice(-2);
      const url =
        action === "view"
          ? `https://workbench.developerforce.com/retrieve.php?id=${id}`
          : "https://workbench.developerforce.com/query.php";
      globalActions.insertAdjacentHTML(
        "beforebegin",
        `<a id="workbench-link" href="${url}" style="float: left; padding: 8px">WorkBench</a>`
      );

      // TODO encapsulate in MonkeyScript?
      // https://stackoverflow.com/questions/6390341/how-to-detect-if-url-has-changed-after-hash-in-javascript
      history.pushState = ((f) =>
        function pushState() {
          var ret = f.apply(this, arguments);
          window.dispatchEvent(new Event("pushstate"));
          window.dispatchEvent(new Event("locationchange"));
          return ret;
        })(history.pushState);

      history.replaceState = ((f) =>
        function replaceState() {
          var ret = f.apply(this, arguments);
          window.dispatchEvent(new Event("replacestate"));
          window.dispatchEvent(new Event("locationchange"));
          return ret;
        })(history.replaceState);

      window.addEventListener("popstate", () => {
        window.dispatchEvent(new Event("locationchange"));
      });

      window.addEventListener("locationchange", () => {
        const [id, action] = window.location.href.split("/").slice(-2);
        const url =
          action === "view"
            ? `https://workbench.developerforce.com/retrieve.php?id=${id}`
            : "https://workbench.developerforce.com/query.php";
        document.querySelector("#workbench-link").setAttribute("href", url);
      });
    } catch (e) {
      console.error(e.toString());
    }
  });
});
