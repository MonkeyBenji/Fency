import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  if (location.pathname !== "/") return;
  const office365Button = await Monkey.waitForSelector(
    "#idp_section_buttons > button"
  );
  office365Button.click();
});
