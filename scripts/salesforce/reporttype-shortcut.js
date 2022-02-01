import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  const reportTypeName = await Monkey.waitForSelector(
    ".reportBuilder-view li > span"
  );
  reportTypeName.innerHTML +=
    ' <a href="/lightning/setup/CustomReportTypes/home" target="_top">(edit types)</a>';
});
