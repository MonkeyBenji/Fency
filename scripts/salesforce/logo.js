import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  try {
    const globalHeader = await Monkey.waitForSelector(
      ".slds-global-header__logo"
    );
    globalHeader.outerHTML = `<a href="/">${globalHeader.outerHTML}</a>`;
  } catch (e) {}
});
