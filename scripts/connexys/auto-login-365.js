import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  const office365Button = await Monkey.waitForSelector(
    "#idp_section_buttons > button"
  );
  console.log(office365Button);
  office365Button.click();
});
