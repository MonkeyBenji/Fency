import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  try {
    const logo = await Monkey.waitForSelector(
      "#oneHeader .slds-global-header__logo"
    );
    const url = new URL(window.location);
    let label = "2copy";
    if (url.host.includes("--fullcopy")) {
      url.host = url.host.replace("--fullcopy", "");
      label = "2live";
    } else {
      url.host = url.host.replace(".lightning", "--fullcopy.lightning");
    }
    logo.insertAdjacentHTML(
      "afterend",
      `<a href="${url}" style="top: 19px; position: absolute; left: 222px;">${label}</a>`
    );
  } catch (e) {
    console.error(e.toString());
  }
});
