import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  document.addEventListener(
    "click",
    async (ev) => {
      if (!ev.target.matches('a[data-label="Documenten"]')) return;
      const generatedTab = await Monkey.waitForSelector(
        "#cxsrec__Last_CV_generator_template__c__item"
      );
      if (!generatedTab.querySelector(".slds-icon-utility-page")) return;
      generatedTab.click();
    },
    { passive: true }
  );
});
