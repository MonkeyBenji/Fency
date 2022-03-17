import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  const setWidth = (field, percentage, clear = "none") => {
    if (!field) return console.warn("Field not found");
    field.style.float = "left";
    field.style.width = `${percentage}%`;
    field.style.clear = clear;
    field.querySelector("span.slds-form-element__label").style.minHeight =
      "24px";
    const select = field.querySelector("select");
    if (select) select.style.minHeight = "36px";
  };

  const setValue = (field, value) => {
    const input = field && field.querySelector("input,select");
    input.focus();
    if (input) input.value = value;
    else console.warn("Could not find input", field);
    input.dispatchEvent(new Event("change"));
  };

  const selectToToggle = (field) => {
    if (!field) return console.warn("Field not found");
    const select = field.querySelector("select");
    if (!select.multiple) {
      select.multiple = true;
      select.addEventListener("click", () => (select.value = select.value));
    }
    select.size = 1;
    select.style.height = "auto";
    select.style.overflow = "hidden";
    select.style.scrollbarWidth = "none";
    const options = select.querySelectorAll("option");
    options.forEach((option) => {
      option.style.boxSizing = "border-box";
      option.style.display = "inline-block";
      option.style.width = `${100 / options.length}%`;
      option.style.textAlign = "center";
      option.style.borderRadius = "4px";
    });
  };

  const darkMagicNameSplitter = (name) =>
    name
      .trim()
      .split(" ")
      .reduce(
        ([first, suffix, last], part) => {
          part = part.trim();
          if (first === "") return [part, "", ""];
          if (last === "" && part[0].toLowerCase() === part[0])
            return [first, `${suffix} ${part}`.trim(), ""];
          return [first, suffix, `${last} ${part}`.trim()];
        },
        ["", "", ""]
      );

  const doStuff = async () => {
    if (window.location.pathname !== "/lightning/o/cxsrec__cxsCandidate__c/new")
      return;
    await Monkey.waitForSelector("select.slds-input");
    await Monkey.waitForSelector("div.ql-editor");
    await new Promise((r) => setTimeout(r, 1337));

    const fieldsByName = Object.fromEntries(
      [...document.querySelectorAll("div.cxsrecField")].map((field) => [
        field.querySelector("span").childNodes[1].textContent,
        field,
      ])
    );

    setWidth(fieldsByName["Roepnaam"], 100 / 3);
    setWidth(fieldsByName["Tussenvoegsel"], 100 / 3);
    setWidth(fieldsByName["Achternaam"], 100 / 3);

    setWidth(fieldsByName["Geboortedatum"], 100 / 2, "left");
    setWidth(fieldsByName["Geslacht"], 100 / 2);

    setWidth(fieldsByName["E-mailadres"], 100 / 2, "left");
    setWidth(fieldsByName["Adres LinkedIn-pagina"], 100 / 2);
    setWidth(fieldsByName["Telefoonnummer"], 100 / 2, "left");
    setWidth(fieldsByName["Aanvullende contactgegevens"], 100 / 2);

    setWidth(fieldsByName["Onderwijsinstelling"], 100 / 2, "left");
    setWidth(fieldsByName["Afstudeerdatum"], 100 / 2);

    setWidth(fieldsByName["Hoogst genoten afgeronde opleiding"], 100 / 2);
    setWidth(fieldsByName["Opleidingsrichting"], 100 / 2);

    setWidth(fieldsByName["Straat en huisnummer"], 100 / 3, "left");
    setWidth(fieldsByName["Postcode"], 100 / 6);
    setWidth(fieldsByName["Woonplaats"], 100 / 3);
    setWidth(fieldsByName["Provincie"], 100 / 6);

    setWidth(fieldsByName["Hoogst genoten afgeronde opleiding"], 100 / 2);
    setWidth(fieldsByName["Opleidingsrichting"], 100 / 2);
    setWidth(fieldsByName["Rijbewijs"], 100 / 2);

    selectToToggle(fieldsByName["Geslacht"]);
    selectToToggle(fieldsByName["Rijbewijs"]);

    const firstInput = fieldsByName["Roepnaam"].querySelector("input");
    firstInput.addEventListener("paste", (ev) => {
      ev.preventDefault();
      const pasta = (ev.clipboardData || window.clipboardData).getData("text");
      pasta.split("\n").forEach((line) => {
        const keyVal = line.trim().split(":");
        if (keyVal.length > 1) {
          const key = keyVal[0].trim();
          const val = keyVal.slice(1).join(":").trim();
          switch (key) {
            case "Naam":
              const [first, suffix, last] = darkMagicNameSplitter(val);
              setValue(fieldsByName["Roepnaam"], first);
              setValue(fieldsByName["Tussenvoegsel"], suffix);
              setValue(fieldsByName["Achternaam"], last);
              break;
            case "Telefoonnummer":
              setValue(fieldsByName["Telefoonnummer"], val);
              break;
            case "Regio":
            case "Provincie":
              setValue(fieldsByName["Provincie"], val);
              break;
            case "E-mailadres":
            case "E-mail":
            case "Email":
              setValue(fieldsByName["E-mailadres"], val);
              break;
            case "Contact voorkeur":
              setValue(
                fieldsByName["Aanvullende contactgegevens"],
                "Contact voorkeur: " + val
              );
              break;
          }
        }
      });
    });
  };
  Monkey.onLocationChange(doStuff);
  doStuff();
});
