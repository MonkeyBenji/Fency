const select = (label, options = [], defaultValue = null) =>
  new Promise((resolve, reject) => {
    const dialog = document.createElement("dialog");

    const form = document.createElement("form");
    form.setAttribute("method", "dialog");

    const style = document.createElement("style");
    style.textContent = `
  /* Your CSS styles here */
`;

    form.appendChild(style);

    const paragraph = document.createElement("p");
    const labelElement = document.createElement("label");
    labelElement.textContent = label;

    const selectElement = document.createElement("select");

    options.forEach(({ value, text }) => {
      const optionElement = document.createElement("option");
      optionElement.setAttribute("value", value);
      optionElement.textContent = text;
      selectElement.appendChild(optionElement);
    });

    labelElement.appendChild(selectElement);
    paragraph.appendChild(labelElement);
    form.appendChild(paragraph);

    const menu = document.createElement("menu");

    const submitButton = document.createElement("button");
    submitButton.setAttribute("type", "submit");
    submitButton.setAttribute("value", "");
    submitButton.textContent = "OK";
    menu.appendChild(submitButton);

    const resetButton = document.createElement("button");
    resetButton.setAttribute("type", "reset");
    resetButton.setAttribute("value", "cancel");
    resetButton.textContent = "Cancel";
    menu.appendChild(resetButton);

    form.appendChild(menu);

    dialog.appendChild(form);

    // Append the dialog to the body or any other element in your document
    document.body.appendChild(dialog);

    if (typeof dialog.showModal !== "function") {
      alert("about:config -> dom.dialog_element.enabled");
      reject("unsupported");
    } else {
      const select = dialog.querySelector("select");
      if (defaultValue) select.value = defaultValue;

      let cancelled = false;
      const cancel = () => {
        cancelled = true;
        dialog.close();
      };
      dialog.querySelector('button[type="reset"]').addEventListener("click", cancel);

      dialog.addEventListener("click", (ev) => ev.target === dialog && cancel());

      dialog.addEventListener("close", () => {
        if (cancelled) {
          reject();
        } else {
          resolve(select.value);
        }
        dialog.parentElement.removeChild(dialog);
      });
      document.body.appendChild(dialog);
      dialog.showModal();
    }
  });

export { select };
