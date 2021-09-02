import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  document.body.addEventListener("click", async (ev) => {
    console.log("click");
    if (!ev.target.closest(".cxsrecWorkflowStepActions")) return;

    console.log("step clicked");
    await Monkey.waitForTrue(
      () =>
        document.querySelectorAll(".cxsField_PICKLIST select.uiInput--select")
          .length > 3
    );
    console.log("selects found");
    const modal = document.querySelector(".modal-body");
    modal.querySelector("h3:first-of-type button").click();

    const setWidth = (field, percentage, clear = "none") => {
      if (!field) return console.warn("Field not found");
      field.style.float = "left";
      field.style.width = `${percentage}%`;
      field.style.clear = clear;
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

    const fieldsByName = Object.fromEntries(
      [...modal.querySelectorAll("div.cxsrecField")].map((field) => [
        field.querySelector("span").childNodes[1].textContent,
        field,
      ])
    );

    setWidth(fieldsByName["Functiedomein"], 100 / 2);
    setWidth(fieldsByName["Functierol"], 100 / 2);

    // setWidth(fieldsByName["Straat en huisnummer"], 100);

    setWidth(fieldsByName["Postcode"], 100 / 3, "left");
    setWidth(fieldsByName["Woonplaats"], 100 / 3);
    setWidth(fieldsByName["Provincie"], 100 / 3);

    setWidth(fieldsByName["Telefoonnummer"], 100 / 3, "left");
    setWidth(fieldsByName["Aanvullende contactgegevens"], 100 / 3);
    setWidth(fieldsByName["E-mailadres"], 100 / 3);

    setWidth(fieldsByName["Beschikbaar per"], 100 / 4, "left");
    setWidth(fieldsByName["Uren per week beschikbaar"], 75 / 2);
    setWidth(fieldsByName["24*7 diensten/Onregelmatigheiddienst"], 75 / 2);

    setWidth(fieldsByName["Gewenste brutosalaris"], 100 / 2, "left");
    setWidth(fieldsByName["Minimale brutosalaris"], 100 / 2);

    // setWidth(fieldsByName["Opzegtermijn"], 100);

    setWidth(fieldsByName["Eigen vervoer"], 100 / 2, "left");
    setWidth(fieldsByName["Rijbewijs"], 100 / 2);

    if (fieldsByName["Divisie"]) fieldsByName["Divisie"].style.display = "None";

    // setWidth(fieldsByName["Gewenste functie"], 100);

    setWidth(fieldsByName["Hoogst genoten afgeronde opleiding"], 100 / 3);
    setWidth(fieldsByName["Opleidingsrichting"], 100 / 3);
    setWidth(fieldsByName["Afstudeerdatum"], 100 / 3);

    // setWidth(fieldsByName["Aantal jaren ervaring"], 100);

    selectToToggle(fieldsByName["Uren per week beschikbaar"]);
    selectToToggle(fieldsByName["24*7 diensten/Onregelmatigheiddienst"]);
    selectToToggle(fieldsByName["Opzegtermijn"]);
    selectToToggle(fieldsByName["Eigen vervoer"]);
    selectToToggle(fieldsByName["Rijbewijs"]);
    selectToToggle(fieldsByName["Aantal jaren ervaring"]);
    selectToToggle(fieldsByName["Talen"]);
  });

  //   Monkey.css(`.cxsField_STRING {
  //   max-width: 33%;
  //   float: left;
  //   clear: none !important;
  // }
  // .cxsField_DATE {
  //   max-width: 49%;
  //   float: left;
  //   clear: none !important;
  // }
  // .cxsrecField.cxsField_TEXTAREA .uiInputTextArea {
  //   height: 70px;
  // }
  // `);
});
