const select = (label, options = [], defaultValue = null) =>
  new Promise((resolve, reject) => {
    const dialog = document.createElement("dialog");
    const optionsHtml = options
      .map(({ value, text }) => `<option value="${value}">${text}</option>`)
      .join("\n");
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
        <label>${label}
        <select>${optionsHtml}</select>
        </label>
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
      const select = dialog.querySelector("select");
      if (defaultValue) select.value = defaultValue;

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
          resolve(select.value);
        }
        dialog.parentElement.removeChild(dialog);
      });
      document.body.appendChild(dialog);
      dialog.showModal();
    }
  });

export { select };
