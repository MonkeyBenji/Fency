import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  const doStuff = async () => {
    if (!window.location.href.includes("Account/list")) return;
    const accountsLabel = await Monkey.waitForSelector(
      ".forceListViewManagerHeader li > span"
    );

    if (!accountsLabel.innerHTML.includes("merge"))
      accountsLabel.innerHTML +=
        ' (<a href="https://inwork.cloudforce.com/merge/accmergewizard.jsp">merge</a>)';
  };
  Monkey.onLocationChange(doStuff);
  doStuff();
});
