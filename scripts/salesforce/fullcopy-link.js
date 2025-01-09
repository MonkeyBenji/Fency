import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  try {
    const logo = await Monkey.waitForSelector("#oneHeader .slds-global-header__logo");
    const getUrl = () => {
      const url = new URL(window.location);
      if (url.host.includes("--fullcopy.sandbox")) {
        url.host = url.host.replace("--fullcopy.sandbox", "");
      } else {
        url.host = url.host.replace(".lightning", "--fullcopy.sandbox.lightning");
      }
      return url;
    };
    const isFullCopy = window.location.href.includes("--fullcopy");
    const a = document.createElement("a");
    a.innerText = isFullCopy ? "2live" : "2copy";
    a.setAttribute("href", getUrl());
    a.setAttribute("style", "top: 19px; position: absolute; left: 234px; background: #f8f8f8");
    a.addEventListener("click", () => (a.href = getUrl()));
    logo.parentElement.appendChild(a);
  } catch (e) {
    console.error(e.toString());
  }
});
