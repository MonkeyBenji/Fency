import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  Monkey.waitForSelector(
    ".query-builder-widget li.slds-tabs_default__item:not(.slds-is-active) .tab-label"
  )
    .then((span) => {
      const a = Monkey.createElement(
        `<a href="#nofilter" style="position: absolute;top: 26px;right: 4px;z-index: 1337;font-weight: normal">#nofilter</a>`
      );
      span.parentNode.insertBefore(a, span);
      a.addEventListener("click", async (ev) => {
        ev.preventDefault();
        const filterTab = document.querySelector(
          "li.slds-tabs_default__item:last-of-type"
        );
        filterTab.click();

        const filterApplyBeGone = () =>
          document.querySelector("button.filter-apply") === null;

        // #nofilter
        // Remove My Accounts filter
        const buttonScope = await Monkey.waitForSelector(
          ".filterContainer.SCOPE button"
        );
        buttonScope.click();
        const picklistScope = await Monkey.waitForSelector(
          ".filter-popover .slds-picklist button"
        );
        picklistScope.click();
        const picklistItemAllOfThem = await Monkey.waitForSelector(
          ".filter-popover .slds-dropdown__item:last-of-type a"
        );
        picklistItemAllOfThem.click();
        const buttonApplyScope = await Monkey.waitForSelector(
          ".filter-popover button.filter-apply"
        );
        buttonApplyScope.click();
        await Monkey.waitForTrue(filterApplyBeGone);

        // Remove Creation Date Filter
        const buttonDate = await Monkey.waitForSelector(
          ".filterContainer.STANDARDDATE button"
        );
        buttonDate.click();
        const picklistDate = await Monkey.waitForSelector(
          ".filter-popover .custom-range-picklist .slds-picklist button"
        );
        picklistDate.click();
        const picklistItemAllTheTime = await Monkey.waitForSelector(
          ".filter-popover .slds-dropdown__item:first-of-type a"
        );
        picklistItemAllTheTime.click();
        const buttonApplyDate = await Monkey.waitForSelector(
          ".filter-popover button.filter-apply"
        );
        buttonApplyDate.click();
        await Monkey.waitForTrue(filterApplyBeGone);

        // Add Anonimize filter for candidates
        if (
          document.querySelector(".dash-title .dash-tag").textContent ===
          "[iw] Kandidaten"
        ) {
          document
            .querySelector(".filters-panel .slds-combobox__input")
            .click();
          [...document.querySelectorAll("ul.report-combobox-listbox li > span")]
            .filter((li) => li.textContent === "Anonimiseringsstatus")[0]
            .click();
          (
            await Monkey.waitForSelector(
              ".filter-popover .slds-picklist button"
            )
          ).click();
          (
            await Monkey.waitForSelector(
              ".filter-popover .slds-dropdown__item:nth-of-type(2) a"
            )
          ).click();
          (
            await Monkey.waitForSelector(
              "ul.multi-picklist-container li:nth-of-type(4) a"
            )
          ).click();
          document.querySelector(".filter-popover button.filter-apply").click();
          await Monkey.waitForTrue(filterApplyBeGone);
        }
      });
    })
    .catch(() => {});
});
