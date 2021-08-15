const coordsDialog = (
  options = {
    default: "",
    country: "Nederland",
  }
) =>
  new Promise((resolve, reject) => {
    const dialog = document.createElement("dialog");
    dialog.innerHTML = `<form method="dialog">
      <p>
        <label>Location:<input type="text"></label>
        <label><input type="checkbox" value=", Nederland" checked>, Nederland</label>
      </p>
      <p>
        <label>Matches:<select required></select></label>
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
          resolve(JSON.parse(select.value));
        }
      });
      document.body.appendChild(dialog);
      dialog.showModal();
    }
  });

export { coordsDialog };
