import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  try {
    const logo = await Monkey.waitForSelector(
      "#oneHeader .slds-global-header__logo"
    );
    const getUrl = () => {
      const url = new URL(window.location);
      if (url.host.includes("--fullcopy")) {
        url.host = url.host.replace("--fullcopy", "");
      } else {
        url.host = url.host.replace(".lightning", "--fullcopy.lightning");
      }
      return url;
    };
    const a = document.createElement("a");
    a.innerText = window.location.href.includes("--fullcopy")
      ? "2live"
      : "2copy";
    a.setAttribute("href", getUrl());
    a.setAttribute(
      "style",
      "top: 19px; position: absolute; left: 222px; background: #f8f8f8"
    );
    a.addEventListener("click", () => (a.href = getUrl()));
    logo.parentElement.appendChild(a);
  } catch (e) {
    console.error(e.toString());
  }
});
