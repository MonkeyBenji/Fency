import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  let prevLocation = null;
  const doStuff = () => {
    // Page == CV Generator
    try {
      if (window.location.pathname !== "/one/one.app") return;
      if (prevLocation === window.location.href) return;
      prevLocation = window.location.href;
      const oneApp = JSON.parse(atob(window.location.hash.slice(1)));
      if (oneApp.componentDef !== "cxsrec:CVGenerator") return;
    } catch (e) {
      return;
    }

    // Enable disabled date input
    Monkey.css(`.slds-is-open .disabledDateInput {
    pointer-events: auto !important;
  }`);

    // More fields per row
    Monkey.css(`
  .cvSection-Educations .cxsField_STRING {
    max-width: 33%;
    float: left;
    clear: none !important;
  }
  .cvSection-WorkExperiences .cxsField_STRING {
    max-width: 50%;
    float: left;
    clear: none !important;
  }
  .cvSection-Educations .cxsField_DATE,
  .cvSection-WorkExperiences .cxsField_DATE {
    max-width: 50%;
    float: left;
    clear: none !important;
  }
  .cvSection-Educations .cxsrecField.cxsField_TEXTAREA .uiInputTextArea,
  .cvSection-WorkExperiences .cxsrecField.cxsField_TEXTAREA .uiInputTextArea {
    height: 70px;
  }
  `);

    // Anonymize CV
    Monkey.waitForSelector(".genCVMeta lightning-input").then((input) => {
      Monkey.js(() => {
        document
          .querySelector(".genCVMeta lightning-input")
          .shadowRoot.querySelector("input").checked = true;
      });
    });

    // Add Refresh Info Candidate button
    Monkey.waitForSelector("lightning-icon.slds-icon-utility-save")
      .then((save) => {
        const button = document.createElement("button");
        button.textContent = "Ververs info kandidaat";
        button.classList.add("slds-button");
        button.classList.add("slds-button_brand");
        button.style.marginLeft = "20px";
        button.addEventListener("click", () => {
          Monkey.js(() => {
            document
              .querySelector("lightning-tab-bar")
              .shadowRoot.querySelector(
                'li[data-tab-value="candidateRecordTab"]'
              )
              .click();
            setTimeout(() => {
              document.querySelector("#candidateRecordTab button").click();
            }, 1337);
          });
        });
        save.parentNode.appendChild(button);
      })
      .catch(() => {});
  };
  Monkey.onLocationChange(doStuff);
  doStuff();
});
