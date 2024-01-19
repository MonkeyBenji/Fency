document.addEventListener(
  "click",
  async (ev) => {
    if (!ev.target.matches("#insext *")) return;
    const pathSplit = window.location.pathname.split("/");
    const recordId = pathSplit[4];
    if (typeof recordId === "undefined") return;
    const existingSelect = document.querySelector("#every-day-were-soqling");
    if (existingSelect && ev.target !== existingSelect) {
      existingSelect.parentElement.removeChild(existingSelect);
    }

    setTimeout(() => {
      if (!document.querySelector("#insext.insext-active")) return;

      const inspectorUrl = new URL(document.querySelector(".insext-popup").src);
      inspectorUrl.pathname = "data-export.html";
      inspectorUrl.searchParams.set("host", window.location.hostname.split(".")[0] + ".my.salesforce.com");

      const select = document.createElement("select");
      select.id = "every-day-were-soqling";
      select.style = "position: absolute; width: 90px; z-index: 9999999999999999999; right: 8px; top: 42px;";

      const queries = {
        SOQL: "SOQL",
        Taken: `SELECT Id, Subject, OwnerId FROM Task WHERE WhatId = '${recordId}'`,
        "Taken (kandidaat update)": `SELECT Id, Subject, OwnerId FROM Task WHERE WhatId = '${recordId}' AND Status = 'Not Started'`,
        "Gegenereerde CV's": `SELECT Id, Name, cxsrec__CV_PDF_Name__c, OwnerId FROM cxsrec__cxsGenerated_CV__c WHERE cxsrec__Candidate__c = '${recordId}'`,
        "Inschrijvingen Kandidaat": `SELECT Id, Name, OwnerId FROM cxsrec__cxsJob_application__c WHERE cxsrec__Candidate__c = '${recordId}`,
        "Inschrijvingen Vacature": `SELECT Id, Name, OwnerId FROM cxsrec__cxsJob_application__c WHERE cxsrec__Position__c = '${recordId}`,
      };

      Object.entries(queries).forEach(([label, soql]) => {
        const option = document.createElement("option");
        option.textContent = label;
        option.value = soql;
        select.appendChild(option);
      });

      document.querySelector("#insext").appendChild(select);

      select.addEventListener("change", () => {
        inspectorUrl.searchParams.set("query", select.value);
        window.open(inspectorUrl);
        select.outerHTML = "";
      });
    }, 123);
  },
  { capture: true, passive: true }
);
