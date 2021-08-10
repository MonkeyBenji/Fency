import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  // Add 🇳🇱 and 🇬🇧 flags
  if (window.self === window.top)
    setTimeout(async () => {
      try {
        const globalActions = await Monkey.waitForSelector(
          ".slds-global-actions"
        );
        const switches = document.createElement("div");
        const dutch = 23;
        const english = 1;
        const url =
          "https://inwork.cloudforce.com/setup/languageAndTimeZoneSetup.apexp?isdtp=p1&sfdcIFrameOrigin=https://inwork.lightning.force.com#language=";
        switches.innerHTML = `<a href="${url}${dutch}" target="_blank" style="padding: 4px">🇳🇱</a><a href="${url}${english}" target="_blank" style="padding: 4px">🇬🇧</a>`;
        globalActions.insertBefore(switches, globalActions.firstChild);
      } catch (e) {}
    }, 42);

  // Automatically set language when arriving on settings page and close it
  if (
    window.location.href.includes("/setup/languageAndTimeZoneSetup.apexp") &&
    window.location.hash.startsWith("#language=")
  ) {
    const language = new URL(
      window.location.href.replace("#", "?&")
    ).searchParams.get("language");
    const languageElement = document.getElementById(
      "LanguageAndTimeZoneSetup:editPage:editPageBlock:languageLocaleKey"
    );
    const submitButton = languageElement
      .closest("form")
      .querySelector(".btn.primary");
    languageElement.value = language;
    submitButton.click();
    await Monkey.sleep(1337);
    if (history.length === 1) Monkey.close();
    else history.back();
  }
});
