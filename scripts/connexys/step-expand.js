import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  document.body.addEventListener("click", async (ev) => {
    if (!window.location.href.includes("cxsrec__cxsJob_application__c")) return;
    if (!ev.target.matches("a.slds-tabs_default__link")) return;
    try {
      await Monkey.waitForSelector(".slds-timeline__item_expandable button");
      document
        .querySelectorAll('ul.slds-timeline button[aria-expanded="false"]')
        .forEach((button) => button.click());
    } catch (e) {
      // Probably other tab
    }
  });
});
