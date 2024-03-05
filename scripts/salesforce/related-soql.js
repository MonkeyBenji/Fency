document.addEventListener(
  "click",
  async (ev) => {
    if (!ev.target.matches("#insext *")) return;
    const insext = document.querySelector("#insext");
    const wasActive = insext.classList.contains("insext-active");
    const pathSplit = window.location.pathname.split("/");
    const recordId = pathSplit[4];
    if (typeof recordId === "undefined") return;
    const existingSelect = document.querySelector("#every-day-were-soqling");
    if (existingSelect && ev.target !== existingSelect) {
      existingSelect.parentElement.removeChild(existingSelect);
    }

    setTimeout(() => {
      if (wasActive) return;

      const inspectorUrl = new URL(document.querySelector(".insext-popup").src);
      inspectorUrl.pathname = "data-export.html";
      inspectorUrl.searchParams.set("host", window.location.hostname.split(".")[0] + ".my.salesforce.com");

      const select = document.createElement("select");
      select.id = "every-day-were-soqling";
      const style = document.createElement("style");
      style.textContent = `#every-day-were-soqling { display: none; position: absolute; width: 90px; z-index: 9999999999999999999; right: 8px; top: 42px; }
      .insext-active #every-day-were-soqling { display: block; }`;

      const queries = {
        SOQL: "SOQL",
        Taken: `SELECT Id, Subject, OwnerId FROM Task WHERE WhatId = '${recordId}'`,
        "Taken (kandidaat update)": `SELECT Id, Subject, OwnerId FROM Task WHERE WhatId = '${recordId}' AND Status = 'Not Started'`,
        "Gegenereerde CV's": `SELECT Id, Name, cxsrec__CV_PDF_Name__c, OwnerId FROM cxsrec__cxsGenerated_CV__c WHERE cxsrec__Candidate__c = '${recordId}'`,
        "Inschrijvingen Kandidaat": `SELECT Id, Name, OwnerId FROM cxsrec__cxsJob_application__c WHERE cxsrec__Candidate__c = '${recordId}'`,
        "Inschrijvingen Vacature": `SELECT Id, Name, OwnerId FROM cxsrec__cxsJob_application__c WHERE cxsrec__Position__c = '${recordId}'`,
        "Kandidaten van Gebruiker": `SELECT Id, OwnerId FROM cxsrec__cxsCandidate__c WHERE cxsrec__Anonymize_status__c != 'Anonymized' AND OwnerId = '${recordId}'`,
      };

      Object.entries(queries).forEach(([label, soql]) => {
        const option = document.createElement("option");
        option.textContent = label;
        option.value = soql;
        select.appendChild(option);
      });

      document.querySelector("#insext").appendChild(select);
      document.querySelector("#insext").appendChild(style);

      select.addEventListener("change", () => {
        inspectorUrl.searchParams.set("query", select.value);
        window.open(inspectorUrl);
      });
    }, 123);
  },
  { capture: true, passive: true }
);
