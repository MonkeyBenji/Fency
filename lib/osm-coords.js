const coordsDialog = (
  options = {
    default: "",
    country: "Nederland",
  }
) =>
  new Promise((resolve, reject) => {
    const dialog = document.createElement("dialog");
    dialog.innerHTML = `<form method="dialog">
      <style>
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
      </style>
      <p>
        <label>Location: <input type="text"></label>
        <label><input type="checkbox" value=", Nederland" checked>, Nederland</label>
      </p>
      <p>
        <label>Matches: <select required><option value="">-search location first-</option></select></label>
      </p>
      <menu>
        <button type="submit" value="">OK</button>
        <button type="reset" value="cancel">Cancel</button>
      </menu>
    </form>`;
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
            select.innerHTML = "<option></option>";
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
      dialog
        .querySelector('button[type="reset"]')
        .addEventListener("click", cancel);

      dialog.addEventListener(
        "click",
        (ev) => ev.target === dialog && cancel()
      );
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
