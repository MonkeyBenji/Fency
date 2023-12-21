const coordsDialog = (
  options = {
    default: "",
    country: "Nederland",
  }
) =>
  new Promise((resolve, reject) => {
    const dialog = document.createElement("dialog");

    const form = document.createElement("form");
    form.setAttribute("method", "dialog");

    const style = document.createElement("style");
    style.textContent = `
      dialog, button {
        font-family: Inter var,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";
      }
      dialog {
        min-width: 280px;
        padding: 0;
        border: 0;
        border-radius: 8px;
        box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, 
                    rgba(0, 0, 0, 0) 0px 0px 0px 0px, 
                    rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, 
                    rgba(0, 0, 0, 0.04) 0px 10px 10px -5px;
      }
      dialog::backdrop {
        background: rgba(0, 0, 0, .5);
      }
      dialog > form {
        overflow: auto;
      }
      dialog > form > p {
        padding: 16px;
      }
      dialog > form > p:not(:first-of-type) {
        padding-top: 0;
      }
      dialog > form > menu {
        margin: 0;
        padding: 8px;
        background: #f9fafb;
        text-align: right;
        padding-inline-start: 40px;
        padding-inline-end: 10px;
      }
      dialog button {
        font-weight: 500;
        border-radius: 4px;
        padding: 6px 12px;
        cursor: pointer;
        margin-right: 4px;
      }
      dialog button[type="submit"] {
        background: #4299e1;
        border: 1px solid #2b6cb0;
        color: #fff;
      }
      dialog button[type="reset"] {
        background: #fff;
        border: 1px solid #d1d5db;
        color: #374151;
      }
      dialog button:hover {
        opacity: 0.8;
      }
      dialog button[type="submit"]:active {
        opacity: 1;
        box-shadow: inset 0 0 4px #1b426d;
      }
      dialog button[type="reset"]:active {
        opacity: 1;
        box-shadow: inset 0 0 4px #424242;
      }
    `;

    form.appendChild(style);

    const firstParagraph = document.createElement("p");
    const locationLabel = document.createElement("label");
    locationLabel.textContent = "Location: ";
    const locationInput = document.createElement("input");
    locationInput.setAttribute("type", "text");
    locationLabel.appendChild(locationInput);
    firstParagraph.appendChild(locationLabel);

    const checkboxLabel = document.createElement("label");
    const checkboxInput = document.createElement("input");
    checkboxInput.setAttribute("type", "checkbox");
    checkboxInput.setAttribute("value", ", Nederland");
    checkboxInput.setAttribute("checked", "");
    checkboxLabel.appendChild(checkboxInput);
    checkboxLabel.appendChild(document.createTextNode(", Nederland"));
    firstParagraph.appendChild(checkboxLabel);

    form.appendChild(firstParagraph);

    const secondParagraph = document.createElement("p");
    const matchesLabel = document.createElement("label");
    matchesLabel.textContent = "Matches: ";
    const matchesSelect = document.createElement("select");
    matchesSelect.setAttribute("required", "");
    const option = document.createElement("option");
    option.setAttribute("value", "");
    option.textContent = "-search location first-";
    matchesSelect.appendChild(option);
    matchesLabel.appendChild(matchesSelect);
    secondParagraph.appendChild(matchesLabel);

    form.appendChild(secondParagraph);

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
    if (typeof dialog.showModal !== "function") {
      alert("about:config -> dom.dialog_element.enabled");
      reject("unsupported");
    } else {
      // TODO input+debounce
      const input = dialog.querySelector('input[type="text"]');
      const checkbox = dialog.querySelector('input[type="checkbox"]');
      const select = dialog.querySelector("select");
      input.value = options.default;

      const updateOptions = () => {
        const search = input.value + (checkbox.checked ? checkbox.value : "");
        const url = `https://nominatim.openstreetmap.org/search.php?q=${search}&format=jsonv2`;

        fetch(url)
          .then((response) => response.json())
          .then((data) => {
            select.textContent = "";
            select.appendChild(document.createElement("option"));
            data.forEach((result) => {
              const option = document.createElement("option");
              option.textContent = result.display_name;
              option.value = JSON.stringify({
                search: input.value,
                lon: result.lon,
                lat: result.lat,
                name: result.display_name,
              });
              select.appendChild(option);
            });
          });
      };
      if (input.value) updateOptions();
      input.addEventListener("change", updateOptions);

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
          resolve(JSON.parse(select.value));
        }
      });
      document.body.appendChild(dialog);
      dialog.showModal();
    }
  });

export { coordsDialog };
