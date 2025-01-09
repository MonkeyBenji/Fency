import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  try {
    const globalHeader = await Monkey.waitForSelector(".slds-global-header__logo");
    const a = document.createElement("a");
    a.setAttribute("href", "/");
    globalHeader.insertAdjacentElement("afterend", a);
    a.appendChild(globalHeader);
    Monkey.css(`.slds-global-header__logo.bigger {
      transform: scale(1.15) translate(4px, 0);
      transition: all 10s;
    }`);
    setTimeout(() => {
      globalHeader.classList.add("bigger");
    }, 10);
  } catch (e) {}
});
