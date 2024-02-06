import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  const reportTypeName = await Monkey.waitForSelector(".reportBuilder .panelItemGroup .dash-title");
  await Monkey.sleep(13.37);
  reportTypeName.insertAdjacentHTML(
    "beforeend",
    ' <a href="/lightning/setup/CustomReportTypes/home" target="_top" style="padding-left:0.5em">(edit types)</a>'
  );
});
