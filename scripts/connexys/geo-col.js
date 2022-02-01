import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  Monkey.waitForSelector(
    ".report-query-builder .sectionable-table-section:nth-of-type(2) .sectionable-table-section-actions"
  )
    .then((div) => {
      const button =
        Monkey.createElement(`<button id="add-distance-col" title="Voeg afstand kolom toe"><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
          width="26px" height="26px" viewBox="0 0 52 52" enable-background="new 0 0 52 52" xml:space="preserve">
       <path fill="#FFFFFF" d="M26,2C15.5,2,7,10.5,7,21.1c0,13.2,13.6,25.3,17.8,28.5c0.7,0.6,1.7,0.6,2.5,0C31.5,46.3,45,34.3,45,21.1
         C45,10.5,36.5,2,26,2z M26,29c-4.4,0-8-3.6-8-8s3.6-8,8-8s8,3.6,8,8S30.4,29,26,29z"/>
       </svg></button>`);
      div.parentNode.insertBefore(button, div);
      button.addEventListener("click", () => {
        Monkey.coordsDialog().then(
          // Monkey.coordsDialog({ default: "1066JS" }).then(
          async ({ lon, lat, name, search }) => {
            const section = button.closest(".sectionable-table-section-title");
            const dropdownButton = section.querySelector(
              ".slds-dropdown-trigger > button"
            );
            dropdownButton.click();

            const thirdMenuItem = section.querySelector(
              ".slds-dropdown ul li:nth-of-type(3):not(.disabled) a"
            );
            if (!thirdMenuItem)
              return alert("Kan maar 1 rijniveau formule toevoegen");
            thirdMenuItem.click();

            const columnName = await Monkey.waitForSelector(
              "#formula-input-id-name"
            );
            const columnDescription = await Monkey.waitForSelector(
              "#formula-input-id-description"
            );

            columnName.focus();
            await Monkey.type(`Afstand tot ${search}`);

            columnDescription.focus();
            await Monkey.type(name);

            const latitude =
              document
                .querySelector('li[id*="Latitude"]:not([id*="Billing"])')
                .id.split(/__[0-9]_/)[1] ?? "LatColHiero";
            const longitude =
              document
                .querySelector('li[id*="Longitude"]:not([id*="Billing"])')
                .id.split(/__[0-9]_/)[1] ?? "LongColHiero";
            const formula = `DISTANCE(GEOLOCATION(${lat}, ${lon}), GEOLOCATION(${latitude},${longitude}), 'km')`;
            document
              .querySelector(
                ".formulaEditor-editor-textarea .monaco-toolbar-left button:nth-of-type(6)"
              )
              .click(); // Opening "(" via click to focus formula field
            await Monkey.type(formula);
            await Monkey.type(")"); // Starting "(" is clicked in formula editor, ending ")" is typed
          }
        );
      });
    })
    .catch(() => {});
});
