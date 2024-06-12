import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  Monkey.js(() => {
    document.addEventListener("change", async (ev) => {
      const setValue = (input, value) => {
        const setter = Object.getOwnPropertyDescriptor(input.__proto__, "value").set;
        setter.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      };

      const target = ev.target;
      if (!target.matches(".toggle-checkbox lightning-input")) return;
      const checkboxText = target?.shadowRoot?.firstElementChild?.shadowRoot?.querySelector("label span")?.textContent;
      if (checkboxText !== "Wil je een e-mail sturen?") return;
      const getSelectByLabel = (label) =>
        [...document.querySelectorAll("select")].filter(
          (select) =>
            select
              .closest(".slds-form-element")
              ?.querySelector(".slds-form-element__label")
              ?.textContent?.replace("*", "") === label
        );
      const location = getSelectByLabel("Intake locatie")[0];
      if (!location) return;
      if (!location.value) return;
      const template = getSelectByLabel("Selecteer een e-mail template")[0];
      if (!template) return;
      const locationName = location.querySelector("option:checked").textContent.toLocaleLowerCase();
      const templateValue = [...template.querySelectorAll("option")].filter((option) =>
        option.textContent.toLowerCase().includes(locationName)
      )[0]?.value;
      setValue(template, templateValue);
    });
  });
});
