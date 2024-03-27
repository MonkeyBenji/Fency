import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  const dontCloseMe = (ev) => (ev.returnValue = "u sure?");
  let prevLocation = null;
  const doStuff = () => {
    if (window.onbeforeunload === dontCloseMe) window.onbeforeunload = null;
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

    // Prevent changes to be accidentally discarded by closing tabs
    document.addEventListener(
      "input",
      () => {
        if (window.onbeforeunload === null) window.onbeforeunload = dontCloseMe;
      },
      { once: true }
    );

    // Add extra newline after each paragraph (except the last one)
    document.addEventListener("keyup", (ev) => {
      if (ev.key !== "Enter") return;
      const qlEditor = ev.target.closest(".ql-editor");
      if (!qlEditor) return;
      qlEditor.querySelectorAll("p:not(:last-of-type)").forEach((p) => {
        if (p.textContent.endsWith("\n")) return;
        p.lastChild.textContent += "\n";
      });
    });

    // Prevent deleting work or education with required fields because Connexys bug prevents you from saving afterwards
    document.addEventListener("click", async (ev) => {
      const target = ev.target;
      const isDeleteButton = target.matches(".slds-button_text-destructive");
      const isDeleteAllButton = target.matches("ul.slds-accordion > div > button:not(.slds-float_right)");
      if (!isDeleteButton && !isDeleteAllButton) return;
      const parent = isDeleteButton ? target.closest("section") : target.closest(".cvSection");

      const requiredInputsNotFilledIn = [...parent.querySelectorAll(".cxsrecField:has(.slds-required)")]
        .map((field) => field.querySelector("input,textarea,select"))
        .filter((input) => !input.value);

      if (requiredInputsNotFilledIn.length) {
        requiredInputsNotFilledIn[0].scrollIntoView({ block: "center" });
        try {
          const modal = await Monkey.waitForSelector(".active .cxsrecCVGenerator section.slds-modal");
          modal.querySelector("h2").textContent = "Ho eens even!";
          modal.querySelector("p").textContent =
            "Door een bug in Knexis kan je het CV niet opslaan als in de verwijderde opleidingen/werkervaring een verplicht veld niet is ingevuld. Vul eerst de verplichte velden voordat je dit blok mag verwijderen";
          modal.querySelector("button.slds-button_brand").outerHTML = "";
        } catch (e) {}
      }
    });

    // Add open all the things
    Monkey.waitForSelector(".active .cvSection button.slds-button_neutral").then(async () => {
      await Monkey.sleep(100);
      document.querySelectorAll(".active ul.slds-accordion > div.section_buttons").forEach((section) => {
        const button = document.createElement("button");
        button.setAttribute("class", "slds-button slds-float_right");
        button.textContent = "Open all the things!";
        button.addEventListener("click", () => {
          section
            .closest(".cvSection")
            .querySelectorAll(
              button.textContent.startsWith("Open") ? 'button[aria-expanded="false"]' : 'button[aria-expanded="true"]'
            )
            .forEach((accordion) => {
              accordion.click();
              if (button.textContent.startsWith("Open")) {
                button.textContent = "Close all the things!";
              } else {
                button.textContent = "Open all the things!";
              }
            });
        });
        section.appendChild(button);
      });
    });

    // Focus missing required field on error
    document.addEventListener("click", async (ev) => {
      const saveButtonSelector = ".cxsrecCVGenerator ul.slds-list_horizontal > li > button.slds-button_brand";
      if (!ev.target.matches(saveButtonSelector)) return;
      await Monkey.waitForSelector("span.toastMessage");
      await Monkey.sleep(250);

      const requiredInputsNotFilledIn = [...document.querySelectorAll(".active .cxsrecField:has(.slds-required)")]
        .map((field) => field.querySelector("input,textarea,select"))
        .filter((input) => !input.value);
      if (!requiredInputsNotFilledIn.length) return console.log("Ik weet t ook niet man");
      const requiredInput = requiredInputsNotFilledIn[requiredInputsNotFilledIn.length - 1];
      const section = requiredInput.closest("section");
      if (section.classList.contains("cxs-is-closed")) {
        section.querySelector("button").click();
      }
      setTimeout(() => requiredInput.scrollIntoView({ block: "center" }), 200);
    });

    // Change today hyperlink to present for work experience and education
    document.body.addEventListener("click", async (ev) => {
      if (!ev.target.matches(".uiInputDate *")) return;
      if (!ev.target.closest(".cvSection-Educations") && !ev.target.closest(".cvSection-WorkExperiences")) return;
      const oldButton = await Monkey.waitForSelector(".uiDatePicker button.today");
      const newButton = document.createElement("button");
      newButton.className = "today slds-button slds-align_absolute-center slds-text-link";
      newButton.textContent = "Heden";
      newButton.addEventListener("click", () => {
        const input = ev.target.closest(".uiInputDate").querySelector("input");
        input.focus();
        input.value = "heden";
        input.dispatchEvent(new Event("change"));
      });
      oldButton.parentNode.appendChild(newButton);
      oldButton.parentNode.removeChild(oldButton);
    });

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
    Monkey.waitForSelector(".active .genCVMeta lightning-input").then(() => {
      Monkey.js(() => {
        const setValue = (input, value) => {
          const setter = Object.getOwnPropertyDescriptor(input.__proto__, "value").set;
          const event = new Event("input", { bubbles: true });
          setter.call(input, value);
          input.dispatchEvent(event);
        };
        const input = document
          .querySelector(".active .genCVMeta lightning-input")
          .shadowRoot.firstElementChild.shadowRoot.querySelector("input");
        const fixIt = setInterval(() => {
          if (input.value && input.value.startsWith("CV-")) {
            setValue(input, "InWork cv - " + input.value.split("_")[0].substring(3));
            clearInterval(fixIt);
          }
        }, 123);
        setTimeout(() => clearInterval(fixIt), 9001);
      });
    });

    // Add Refresh Info Candidate button
    Monkey.waitForSelector(".active lightning-icon.slds-icon-utility-save")
      .then((save) => {
        const button = document.createElement("button");
        button.textContent = "Ververs info kandidaat";
        button.classList.add("slds-button");
        button.classList.add("slds-button_brand");
        button.style.marginLeft = "20px";
        button.addEventListener("click", () => {
          Monkey.js(() => {
            document
              .querySelector(".active lightning-tab-bar")
              .shadowRoot.querySelector('li[data-tab-value="candidateRecordTab"]')
              .click();
            setTimeout(() => {
              document.querySelector(".active #candidateRecordTab button").click();
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
