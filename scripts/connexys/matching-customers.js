const URL_REPORT_CREATE =
  "/one/one.app#eyJjb21wb25lbnREZWYiOiJyZXBvcnRzOnJlcG9ydEJ1aWxkZXIiLCJhdHRyaWJ1dGVzIjp7InJlY29yZElkIjoiIiwibmV3UmVwb3J0QnVpbGRlciI6dHJ1ZX0sInN0YXRlIjp7fX0%3D";
const KEY = "find-matching-customers-for";
let thisButton = null;

import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  // TODO move functions to SF lib?
  /**
   * Maps the data shown on the current SF-view page to an object
   * key = label, value = value
   * @returns object
   */
  const extractSalesforceDataFromPage = async () => {
    const parser = new DOMParser();
    const html = document.querySelector(".active one-record-home-flexipage2").parentElement.innerHTML; // That's not the same as child.outerHTML today no
    const doc = parser.parseFromString(html, "text/html");
    const map = {};
    [...doc.querySelectorAll("records-record-layout-item")]
      .map((el) => ({
        name: el.querySelector(".test-id__field-label")?.textContent,
        value: el.querySelector(".test-id__field-value")?.textContent,
      }))
      .filter(({ name }) => name)
      .forEach(({ name, value }) => (!map[name] ? (map[name] = value) : null));
    return map;
  };

  const doStuff = async () => {
    if (thisButton !== null) {
      thisButton.unregister();
      thisButton = null;
    }
    const data = await Monkey.get(KEY);

    if (window.location.pathname.includes("/a0A")) {
      // Candidate parsing
      if (thisButton !== null) {
        thisButton.unregister();
        thisButton = null;
      }
      thisButton = Monkey.fab("fa fa-suitcase", "Zoek klantjes!", async () => {
        const map = await extractSalesforceDataFromPage();
        let locationField = map["Postcode"];
        if (!locationField) locationField = map["Woonplaats"];
        const confirmQuestion = `Ik ga op zoek naar klantjes 
in de buurt van: ${locationField}, 
met Business Unit ${map["Business unit"]} 
en functie: ${map["Gewenste functie"]}. 
Ff nergens aanzitten okki?`;
        if (confirm(confirmQuestion)) {
          await Monkey.set(KEY, map);
          window.open(URL_REPORT_CREATE, "_blank");
        } else {
          alert("Dan niet joh!");
        }
      });
    } else if (window.location.pathname.includes("/reports/") && data && !window.location.search.includes("reportId")) {
      // Matching report creation
      const category = await Monkey.waitForSelector(
        ".slds-navigation-list-vertical__action,.slds-nav-vertical__action"
      );
      if (category.matches(".slds-nav-vertical__action")) {
        (await Monkey.waitForSelector(".report-type-section-list .slds-nav-vertical__item:nth-of-type(2) a")).click();
      }

      // [iw] Accounts, next
      await Monkey.waitForSelector(".report-type-list-form a.slds-text-link_reset");
      [...document.querySelectorAll(".report-type-list-form a.slds-text-link_reset")]
        .filter((a) => a.textContent === "[iw] Accounts")[0]
        .click();
      const startReportButton = await Monkey.waitForSelector("button.slds-button_brand");
      startReportButton.click();

      // Save it, cause Salesforce update requires that
      (await Monkey.waitForSelector("button.report-action-ReportSaveAction")).click();
      await Monkey.waitForSelector("#reportName");
      await Monkey.sleep(250);
      await Monkey.type("Tijdelijk rapportje Fency");
      await Monkey.sleep(125);
      (await Monkey.waitForSelector("button.report-save")).click();
    } else if (window.location.pathname.includes("/reports/") && data && window.location.search.includes("reportId")) {
      // Add distance col
      try {
        Monkey.set(KEY, null);
        // Open dialog
        const addDistanceCol = await Monkey.waitForSelector("#add-distance-col");
        addDistanceCol.click();

        // Fill in location search & wait for values
        const locationInput = await Monkey.waitForSelector('form[method="dialog"] input');
        const selectMatches = document.querySelector('form[method="dialog"] select');
        const originalHtml = selectMatches.innerHTML;
        let locationField = data["Postcode"];
        if (!locationField) locationField = data["Woonplaats"];
        locationInput.value = locationField.replace(" ", "");
        locationInput.dispatchEvent(new Event("change"));
        await Monkey.waitForTrue(() => selectMatches.innerHTML !== originalHtml);

        // Set value and close dialog
        selectMatches.value = selectMatches.children[1].value;
        selectMatches.dispatchEvent(new Event("change"));
        document.querySelector('form[method="dialog"] button[type="submit"]').click();

        // Wait for geo-col to do its magic
        await Monkey.waitForTrue(() => document.querySelector(".monaco-editor")?.textContent.includes("))"));
        const applyFormulaButton = await Monkey.waitForSelector(".formula-apply");
        applyFormulaButton.click();
        await Monkey.waitForSelector("li.formulacolumn-row");
      } catch (e) {
        alert("Oei, staat Geo Col wel aan?");
        console.error(e);
      }

      // Goto filters
      const filterTab = await Monkey.waitForSelector("li.slds-tabs_default__item:last-of-type");
      filterTab.click();

      const filterApplyBeGone = () => document.querySelector("button.filter-apply") === null;

      // #nofilter
      // Remove My Accounts filter
      const buttonScope = await Monkey.waitForSelector(".filterContainer.SCOPE button");
      buttonScope.click();
      const picklistScope = await Monkey.waitForSelector(".filter-widget .slds-picklist button");
      picklistScope.click();
      const picklistItemAllOfThem = await Monkey.waitForSelector(".filter-widget .slds-dropdown__item:last-of-type a");
      picklistItemAllOfThem.click();
      const buttonApplyScope = await Monkey.waitForSelector(".filter-widget button.filter-apply");
      buttonApplyScope.click();
      await Monkey.waitForTrue(filterApplyBeGone);

      // Remove Creation Date Filter
      const buttonDate = await Monkey.waitForSelector(".filterContainer.STANDARDDATE button");
      buttonDate.click();
      const picklistDate = await Monkey.waitForSelector(".filter-widget .custom-range-picklist .slds-picklist button");
      picklistDate.click();
      const picklistItemAllTheTime = await Monkey.waitForSelector(
        ".filter-widget .slds-dropdown__item:first-of-type a"
      );
      picklistItemAllTheTime.click();
      const buttonApplyDate = await Monkey.waitForSelector(".filter-widget button.filter-apply");
      buttonApplyDate.click();
      await Monkey.waitForTrue(filterApplyBeGone);

      // Add BU filter
      document.querySelector(".filters-panel .slds-combobox__input").click();
      [...document.querySelectorAll("ul.report-combobox-listbox li > span")]
        .filter((li) => li.textContent === "Business unit")[0]
        .click();
      (await Monkey.waitForSelector(".filter-widget .slds-picklist button")).click();
      (await Monkey.waitForSelector(".filter-widget .slds-dropdown__item:nth-of-type(3) a")).click();
      document.querySelector(".filter-widget .slds-input").focus();
      await Monkey.type(data["Business unit"]);
      document.querySelector(".filter-widget button.filter-apply").click();
      await Monkey.waitForTrue(filterApplyBeGone);

      // Add functions filter
      document.querySelector(".filters-panel .slds-combobox__input").click();
      [...document.querySelectorAll("ul.report-combobox-listbox li > span")]
        .filter((li) => li.textContent === "Functies")[0]
        .click();
      (await Monkey.waitForSelector(".filter-widget .slds-picklist button")).click();
      (await Monkey.waitForSelector(".filter-widget .slds-dropdown__item:nth-of-type(3) a")).click();
      document.querySelector(".filter-widget .slds-input").focus();
      await Monkey.type(data["Gewenste functie"].replace(/;/g, ","));
      document.querySelector(".filter-widget button.filter-apply").click();
      await Monkey.waitForTrue(filterApplyBeGone);

      // Add distance filter
      await Monkey.sleep(1337); // TODO wait for "Afstand tot" to exist
      document.querySelector(".filters-panel .slds-combobox__input").click();
      const distanceCol = await Monkey.waitForSelector(
        "ul.report-combobox-listbox li.slds-dropdown__header + li:last-of-type > span"
      );
      distanceCol.click();
      (await Monkey.waitForSelector(".filter-widget .slds-picklist button")).click();
      (await Monkey.waitForSelector(".filter-widget .slds-dropdown__item:nth-of-type(5) a")).click();
      document.querySelector(".filter-widget .slds-input").focus();
      await Monkey.type("25");
      document.querySelector(".filter-widget button.filter-apply").click();
      await Monkey.waitForTrue(filterApplyBeGone);

      await Monkey.sleep(200);
      const refreshButton = document.querySelector("button.header-warning-refresh");
      if (refreshButton) refreshButton.click();
      await Monkey.sleep(200);
      alert("All done, je mag weer klikken yay");
    }
  };

  Monkey.onLocationChange(doStuff);
  doStuff();
});
