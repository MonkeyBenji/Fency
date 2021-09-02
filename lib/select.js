const select = (label, options = [], defaultValue = null) =>
  new Promise((resolve, reject) => {
    const dialog = document.createElement("dialog");
    const optionsHtml = options
      .map(({ value, text }) => `<option value="${value}"}>${text}</option>`)
      .join("\n");
    dialog.innerHTML = `<form method="dialog">
      <p>
        <label>${label}:</label>
        <label><select>${optionsHtml}</select></label>
      </p>
      <menu>
        <button type="reset" value="cancel">Cancel</button>
        <button type="submit" value="" style="font-weight: bold">Confirm</button>
      </menu>
    </form>`;
    if (typeof dialog.showModal !== "function") {
      alert("about:config -> dom.dialog_element.enabled");
      reject("unsupported");
    } else {
      const select = dialog.querySelector("select");
      if (defaultValue) select.value = defaultValue;

      let cancelled = false;
      dialog
        .querySelector('button[type="reset"]')
        .addEventListener("click", () => {
          cancelled = true;
          dialog.close();
        });

      dialog.addEventListener("close", () => {
        if (cancelled) {
          reject();
        } else {
          resolve(select.value);
        }
      });
      document.body.appendChild(dialog);
      dialog.showModal();
    }
  });

export { select };
