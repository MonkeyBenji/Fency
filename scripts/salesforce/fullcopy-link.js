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
    const isFullCopy = window.location.href.includes("--fullcopy");
    const a = document.createElement("a");
    a.innerText = isFullCopy ? "2live" : "2copy";
    a.setAttribute("href", getUrl());
    a.setAttribute(
      "style",
      "top: 19px; position: absolute; left: 222px; background: #f8f8f8"
    );
    a.addEventListener("click", () => (a.href = getUrl()));
    logo.parentElement.appendChild(a);
    if (isFullCopy)
      Monkey.css(`.slds-global-header {
      background: repeating-linear-gradient(45deg, rgb(84,105,141), rgb(84,105,141) 20px, rgba(84,105,141,.97) 20px, rgba(84,105,141,.97) 40px);
    }
    .slds-global-header a {
      background: #f8f8f8;
    }
    `);
  } catch (e) {
    console.error(e.toString());
  }
});
