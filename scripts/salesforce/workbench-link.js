import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  try {
    const globalActions = await Monkey.waitForSelector(".slds-global-actions");
    const [id, action] = window.location.href.split("/").slice(-2);
    const url =
      action === "view"
        ? `https://workbench.developerforce.com/retrieve.php?id=${id}`
        : "https://workbench.developerforce.com/query.php";
    globalActions.insertAdjacentHTML(
      "beforebegin",
      `<a id="workbench-link" href="${url}" style="float: left; padding: 8px">WorkBench</a>`
    );

    Monkey.onLocationChange(() => {
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
