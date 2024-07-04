import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  Monkey.waitForSelector(
    ".query-builder-widget li.slds-tabs_default__item:not(.slds-is-active) .tab-label",
    5 * 60 * 1000
  )
    .then((span) => {
      const a = Monkey.createElement(
        `<a href="#nofilter" style="position: absolute;top: 26px;right: 4px;z-index: 1337;font-weight: normal;padding-top:11px;line-height:18px">#nofilter</a>`
      );
      span.parentNode.insertBefore(a, span);
      a.addEventListener("click", async (ev) => {
        ev.preventDefault();
        const filterTab = document.querySelector("li.slds-tabs_default__item:last-of-type");
        filterTab.click();

        const filterApplyBeGone = () => document.querySelector("button.filter-apply") === null;

        // #nofilter
        // Remove My Accounts filter
        const buttonScope = await Monkey.waitForSelector(".filterContainer.SCOPE button");
        buttonScope.click();
        const picklistScope = await Monkey.waitForSelector(".filter-widget .slds-picklist button");
        picklistScope.click();
        const picklistItemAllOfThem = await Monkey.waitForSelector(
          ".filter-widget .slds-dropdown__item:last-of-type a"
        );
        picklistItemAllOfThem.click();
        const buttonApplyScope = await Monkey.waitForSelector(".filter-widget button.filter-apply");
        buttonApplyScope.click();
        await Monkey.waitForTrue(filterApplyBeGone);

        // Remove Creation Date Filter
        const buttonDate = await Monkey.waitForSelector(".filterContainer.STANDARDDATE button");
        buttonDate.click();
        const picklistDate = await Monkey.waitForSelector(
          ".filter-widget .custom-range-picklist .slds-picklist button"
        );
        picklistDate.click();
        const picklistItemAllTheTime = await Monkey.waitForSelector(
          ".filter-widget .slds-dropdown__item:first-of-type a"
        );
        picklistItemAllTheTime.click();
        const buttonApplyDate = await Monkey.waitForSelector(".filter-widget button.filter-apply");
        buttonApplyDate.click();
        await Monkey.waitForTrue(filterApplyBeGone);

        const reportName = document.querySelector(".dash-title .dash-tag").textContent.toLocaleLowerCase();
        if (reportName.includes("kandidaten") || reportName.includes("inschrijvingen")) {
          // Add Anonimize filter for candidates
          document.querySelector(".filters-panel .slds-combobox__input").click();
          [...document.querySelectorAll("ul.report-combobox-listbox li > span")]
            .filter((li) => li.textContent.includes("Anonimiseringsstatus"))[0]
            .click();
          (await Monkey.waitForSelector(".filter-widget .slds-picklist button")).click();
          (await Monkey.waitForSelector(".filter-widget .slds-dropdown__item:nth-of-type(2) a")).click();
          (await Monkey.waitForSelector(".multi-picklist-container .multi-picklist-option:nth-of-type(3)"))
            .querySelector("a,button")
            .click();
          document.querySelector(".filter-widget button.filter-apply").click();
          await Monkey.waitForTrue(filterApplyBeGone);

          // Add Recordtype !== hidden filter for candidates
          document.querySelector(".filters-panel .slds-combobox__input").click();
          let recordTypes = [...document.querySelectorAll("ul.report-combobox-listbox li > span")].filter((li) =>
            li.textContent.includes("Recordtype")
          );
          if (recordTypes.length > 1) {
            recordTypes = recordTypes.filter((li) => li.textContent.includes("andida"));
          }
          if (recordTypes.length === 1) {
            recordTypes[0].click();
            (await Monkey.waitForSelector(".filter-widget .slds-picklist button")).click();
            (await Monkey.waitForSelector(".filter-widget .slds-dropdown__item:nth-of-type(2) a")).click();
            (await Monkey.waitForSelector(".multi-picklist-container .multi-picklist-option:nth-of-type(7)"))
              .querySelector("a,button")
              .click();
            document.querySelector(".filter-widget button.filter-apply").click();
            await Monkey.waitForTrue(filterApplyBeGone);
          }
        }
      });
    })
    .catch(() => {});
});
