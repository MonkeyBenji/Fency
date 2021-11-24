import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  const doStuff = () => {
    // Page == CV Generator
    try {
      if (window.location.pathname !== "/one/one.app") return;
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
  .cvSection-Educations .cxsField_STRING,
  .cvSection-WorkExperiences .cxsField_STRING {
    max-width: 33%;
    float: left;
    clear: none !important;
  }
  .cvSection-Educations .cxsField_DATE,
  .cvSection-WorkExperiences .cxsField_DATE {
    max-width: 49%;
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

    // Keep track of text override listeners
    let iDontLikeChange = {};
    document.body.addEventListener("click", (ev) => {
      const realInput = ev.target;
      const id = ev.target.id;
      if (!realInput.matches("input.disabledDateInput.slds-inputundefined"))
        return;

      // Call this when text changes or datepicker is clicked and changes may occur once more
      const iLikeChange = (id) => {
        if (iDontLikeChange[id]) {
          realInput.removeEventListener("change", iDontLikeChange[id]);
          delete iDontLikeChange[id];
        }
      };

      // Create shadow input to retrieve user input, cause Connexys keeps emptying the real onput
      const shadowInput = document.createElement("input");
      shadowInput.classList.add("input");
      shadowInput.classList.add("disabledDateInput");

      const datePicker = realInput.nextSibling;
      realInput.style.display = "none";
      shadowInput.value = realInput.value;
      realInput.parentNode.insertBefore(shadowInput, realInput.nextSibling);
      shadowInput.focus();
      shadowInput.select();

      // When input is filled in make sure Connexys does not override it like ever
      shadowInput.addEventListener(
        "blur",
        () => {
          iLikeChange(id);
          const fixedValue = shadowInput.value;
          realInput.style.display = "block";
          realInput.value = fixedValue;
          iDontLikeChange[id] = (ev) => {
            ev.target.value = fixedValue;
          };
          realInput.addEventListener("change", iDontLikeChange[id]);
          shadowInput.remove();
          realInput.dispatchEvent(new Event("change"));
        },
        { once: true }
      );

      // If datepicker is clicked, perhaps allow datepicker to change the date again
      datePicker.addEventListener("click", () => iLikeChange(id), {
        once: true,
      });
    });
  };
  Monkey.onLocationChange(doStuff);
  doStuff();
});
