import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  if (typeof Monkey.lib === "undefined") return;
  let docxButton = null;
  let exportButton = null;
  let importButton = null;

  /** Find querySelector match whose textContent also matches text */
  const selectorByText = (node, match, text) =>
    [...node.querySelectorAll(match)].filter(
      (node) => node.textContent === text
    )[0];

  /** Convert Connexys from-to date to CV style period */
  const formatPeriod = (from, to, withMonth = false) => {
    return [from, to]
      .map((date) => {
        const [d, m, y] = date.split(" ");
        if (isNaN(d) || isNaN(y)) return date;
        return withMonth ? `${m} ${y}` : y;
      })
      .filter((x) => x)
      .join(" - ");
  };

  const wordNewLinesAndEscape = (s) =>
    (s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\n", "</w:t>\n<w:br/>\n<w:t>");

  /** Crop/resize image to fit within width/height (using CXS CV logic) */
  const getImageResized = (url, width, height) =>
    new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");

      const image = new Image();

      image.onload = () => {
        context.drawImage(
          image,
          0,
          0,
          image.width,
          image.height,
          0,
          0,
          width,
          (image.height / image.width) * height
        );
        resolve(canvas.toDataURL("image/png").split(";base64,")[1]);
      };
      image.onerror = reject;

      Monkey.fetchData(url).then((data) => (image.src = data));
    });

  /** Read the fields from the current Connexys form */
  const getConnexysFields = () => {
    const mapping = [...document.querySelectorAll("div.cxsrecField")]
      .map((div) => {
        const input = div.querySelector("input,select,textarea,.ql-editor");
        if (!input) return null;
        const name = div
          .querySelector("span.slds-form-element__label")
          .childNodes[1].textContent.trim();

        let value;
        if (input.matches(".ql-editor")) {
          // RichText magic
          value = input.innerText
            .replaceAll("\n\n\n\n\n", "\n\n\n\n")
            .replaceAll("\n\n", "\n");
        } else if (input.matches('input[type="checkbox"]')) {
          value = input.checked ? input.value : null;
        } else {
          value = input.value;
        }

        // Group educations and workexperiences
        let section = null;
        if (div.closest(".cvSection-Educations")) section = "education";
        if (div.closest(".cvSection-WorkExperiences")) section = "work";
        if (section && !div.closest(".cxsGenCVSubsection")) return;
        return {
          section,
          name,
          value,
        };
      })
      .filter((x) => x)
      .reduce(
        (map, { section, name, value }) => {
          if (section) {
            // If field was found before, create a new workexperience / education block
            if (name in map[section][map[section].length - 1])
              map[section].push({});
            map[section][map[section].length - 1][name] = value;
          } else {
            map[name] = value;
          }
          return map;
        },
        { education: [{}], work: [{}] }
      );
    if (JSON.stringify(mapping.education) === "[{}]") mapping.education = [];
    if (JSON.stringify(mapping.work) === "[{}]") mapping.work = [];
    return mapping;
  };

  const chunkify = (arr, size) =>
    Array(Math.ceil(arr.length / size))
      .fill(0)
      .map((_, i) => arr.slice(i * size, i * size + size));

  const tReplace = (dom, search, replace) => {
    const t = selectorByText(dom, "t", search);
    t.outerHTML = t.outerHTML.replace(search, replace);
  };

  const nuke = (...elements) =>
    elements.forEach((elem) => (elem.outerHTML = ""));

  const educationAndCertificateMagic = (dom, educationMap) => {
    educationMap = educationMap.map((edu) => ({
      isCertificate: edu["Is certificaat"] !== null,
      period: formatPeriod(edu.Startdatum, edu.Einddatum),
      body:
        (
          (edu.Niveau ? `${edu.Opleiding} (${edu.Niveau})` : edu.Opleiding) +
          "\n" +
          (edu.Instituut ? edu.Instituut + "\n" : "") +
          edu["Overige informatie"]
        ).trim() + "\n",
    }));
    const educations = educationMap.filter((edu) => !edu.isCertificate);
    const certificates = educationMap.filter((edu) => edu.isCertificate);

    const educationT = selectorByText(dom, "t", "Opleiding");
    if (educationT) {
      // InWorkStandard
      const pEducation = educationT.closest("p");
      const pEducationYear = pEducation.previousElementSibling;
      const pEducationTitle =
        pEducationYear.previousElementSibling.previousElementSibling;
      const pCertificate = selectorByText(dom, "t", "Certificaat").closest("p");
      const pCertificateYear = pCertificate.previousElementSibling;
      const pCertificateTitle =
        pCertificateYear.previousElementSibling.previousElementSibling;

      // Opleidingen
      educations.slice(-1)[0].body = educations.slice(-1)[0].body.trim();
      pEducation.outerHTML = educations
        .map((edu) => {
          return (
            pEducationYear.outerHTML.replace("1980", edu.period) +
            pEducation.outerHTML.replace(
              "Opleiding",
              wordNewLinesAndEscape(edu.body)
            )
          );
        })
        .join("\n");
      pEducationYear.outerHTML = "";

      // Certificaten
      pCertificate.outerHTML = certificates
        .map((edu) => {
          return (
            pCertificateYear.outerHTML.replace("1990", edu.period) +
            pCertificate.outerHTML.replace(
              "Certificaat",
              wordNewLinesAndEscape(edu.body)
            )
          );
        })
        .join("\n");
      pCertificateYear.outerHTML = "";

      if (educations.length === 0)
        nuke(pEducationTitle.nextElementSibling, pEducationTitle);
      if (certificates.length === 0)
        nuke(pCertificateTitle.nextElementSibling, pCertificateTitle);
    } else {
      // InWorkLongEducation
      let tr = selectorByText(dom, "t", "Opleiding1").closest("tr");
      const educationsTrXml = tr.outerHTML;

      chunkify(educations, 3).forEach((chunk) => {
        tReplace(tr, "1981", chunk?.[0]?.period ?? "");
        tReplace(tr, "Opleiding1", wordNewLinesAndEscape(chunk?.[0]?.body));
        tReplace(tr, "1982", chunk?.[1]?.period ?? "");
        tReplace(tr, "Opleiding2", wordNewLinesAndEscape(chunk?.[1]?.body));
        tReplace(tr, "1983", chunk?.[2]?.period ?? "");
        tReplace(tr, "Opleiding3", wordNewLinesAndEscape(chunk?.[2]?.body));

        tr.insertAdjacentHTML("afterend", educationsTrXml);
        tr = selectorByText(dom, "t", "Opleiding1").closest("tr");
      });
      if (educations.length === 0) {
        const tbl = tr.closest("tbl");
        nuke(
          tbl,
          tbl.previousElementSibling,
          tbl.previousElementSibling.previousElementSibling
            .querySelector("t")
            .closest("r")
        );
      } else {
        nuke(tr);
      }

      tr = selectorByText(dom, "t", "Certificaat1").closest("tr");
      const certificateTrXml = tr.outerHTML;

      chunkify(certificates, 3).forEach((chunk) => {
        tReplace(tr, "1991", chunk?.[0]?.period ?? "");
        tReplace(tr, "Certificaat1", wordNewLinesAndEscape(chunk?.[0]?.body));
        tReplace(tr, "1992", chunk?.[1]?.period ?? "");
        tReplace(tr, "Certificaat2", wordNewLinesAndEscape(chunk?.[1]?.body));
        tReplace(tr, "1993", chunk?.[2]?.period ?? "");
        tReplace(tr, "Certificaat3", wordNewLinesAndEscape(chunk?.[2]?.body));

        tr.insertAdjacentHTML("afterend", certificateTrXml);
        tr = selectorByText(dom, "t", "Certificaat1").closest("tr");
      });
      if (certificates.length === 0) {
        const tbl = tr.closest("tbl");
        nuke(
          tbl,
          tbl.previousElementSibling,
          tbl.previousElementSibling.previousElementSibling
            .querySelector("t")
            .closest("r")
        );
      } else {
        nuke(tr);
      }
    }
  };

  const doStuff = async () => {
    if (docxButton !== null) {
      docxButton.unregister();
      docxButton = null;
    }
    if (exportButton !== null) {
      exportButton.unregister();
      exportButton = null;
    }
    if (importButton !== null) {
      importButton.unregister();
      importButton = null;
    }

    // Page == CV Generator
    try {
      if (window.location.pathname !== "/one/one.app") return;
      const oneApp = JSON.parse(atob(window.location.hash.slice(1)));
      if (oneApp.componentDef !== "cxsrec:CVGenerator") return;
    } catch (e) {
      return;
    }

    docxButton = Monkey.fab(
      "fa fa-file-word",
      "Word CV'tje genereren",
      async () => {
        await Monkey.lib("jszip");
        const template = (
          await Monkey.waitForSelector('select[name="template"]')
        ).value;
        fetch(`https://fency.dev/misc/${template}.php`)
          .then((response) => response.blob())
          .then(JSZip.loadAsync)
          .then(async (zip) => {
            // Rip fields from Connexys CV gen wizard and put them in a mapping
            const mapping = getConnexysFields();

            // Replace word content
            const xml = await zip.file("word/document.xml").async("string");
            const dom = new DOMParser().parseFromString(xml, "text/xml");

            // Find <w:t> node references in document.xml DOM
            const tName = selectorByText(dom, "t", "Roepnaam");
            const tYear = selectorByText(dom, "t", "1970");
            const tPlace = selectorByText(dom, "t", "Hollum");
            const tDriversLicense = selectorByText(dom, "t", "Soms");
            const pProfile = selectorByText(dom, "t", "Hallo").closest("p");

            const pWork = selectorByText(dom, "t", "Werkgever").closest("p");
            const pWork2 = pWork.nextElementSibling;
            const pWorkDivider = pWork2.nextElementSibling;

            // Single line replacements
            tName.textContent = mapping["Roepnaam"];
            tYear.textContent = mapping["Geboortedatum"].split(" ")[2];
            tPlace.textContent = mapping["Woonplaats"];
            tDriversLicense.textContent = mapping["Rijbewijs"];

            // Persoonsprofiel
            const persoonsProfiel = mapping["Persoonsprofiel"] ?? "";
            pProfile.outerHTML = pProfile.outerHTML.replace(
              "Hallo",
              wordNewLinesAndEscape(
                persoonsProfiel.replaceAll("\n", "\n\n") + "\n"
              )
            );

            educationAndCertificateMagic(dom, mapping["education"]);

            // Werkervaring
            let i = 19; // Shapes have id's in Word, need to uniqueify them or Word will start bitchin
            let workXml = mapping["work"]
              .map((work) => {
                const period = formatPeriod(
                  work.Startdatum,
                  work.Einddatum,
                  true
                );

                return (
                  pWork.outerHTML
                    .replace(
                      "Functie",
                      wordNewLinesAndEscape(work.Functietitel)
                    )
                    .replace("Werkgever", wordNewLinesAndEscape(work.Werkgever))
                    .replace("Periode", period) +
                  pWork2.outerHTML.replace(
                    "Werkzaamheden",
                    wordNewLinesAndEscape(work.Beschrijving)
                  )
                );
              })
              .join(pWorkDivider.outerHTML);
            workXml = workXml.replaceAll(
              '<wp:docPr id="19"',
              () => `<wp:docPr id="${i++}"`
            );
            pWork.outerHTML = workXml;
            pWork2.outerHTML = "";
            pWorkDivider.outerHTML = "";

            zip.file(
              "word/document.xml",
              new XMLSerializer().serializeToString(dom)
            );

            if (Monkey.fetchData)
              zip.file(
                "word/media/image3.png",
                await getImageResized(
                  document.querySelector(".cxsSection_CandidatePhoto img").src,
                  400,
                  400
                ),
                { base64: true }
              );

            zip
              .generateAsync({ type: "blob" })
              .then((content) =>
                Monkey.save(content, `${mapping["Roepnaam"]}.docx`)
              );
          });
      }
    );

    // TODO add more suitable icons to the core
    exportButton = Monkey.fab("fa fa-file-archive", "JSON export", async () => {
      const fields = getConnexysFields();
      const data = [new TextEncoder().encode(JSON.stringify(fields))];
      Monkey.save(
        new Blob(data, { type: "application/json;charset=utf-8" }),
        `${fields.Roepnaam}.json`
      );
    });

    const findChildId = (parent, selector, child) => {
      for (const [i, sibling] of parent.querySelectorAll(selector).entries()) {
        if (sibling === child) return i;
      }
      return null;
    };

    const setValue = (input, value) => {
      console.log(input, value);
      if (input.matches('input[type="checkbox"]')) {
        input.checked = value === input.value;
      } else if (input.matches("input,select,textarea")) {
        input.value = value;
      } else if (input.matches(".ql-editor")) {
        input.textContent = value;
      }
      input.dispatchEvent(new Event("change"));
    };

    const importData = async (data) => {
      // Remove all teh things!
      const deleteButtons = document.querySelectorAll(
        ".slds-accordion:not(.cxsrecTimeline) > div > button:first-of-type"
      );
      for (const deleteButton of deleteButtons) {
        deleteButton.click();
        const confirmButton = await Monkey.waitForSelector(
          'section[role="dialog"] button.slds-button_brand'
        );
        confirmButton.click();
      }
      await Monkey.sleep(222);

      // Add all teh rows!
      for (let i = 0; i < data.education.length; i++) {
        document
          .querySelector(
            ".cvSection.cvSection-Educations:not(.slds-clearfix) > div:last-of-type > button"
          )
          .click();
      }
      for (let i = 0; i < data.work.length; i++) {
        document
          .querySelector(
            ".cvSection.cvSection-WorkExperiences:not(.slds-clearfix) > div:last-of-type > button"
          )
          .click();
      }
      await Monkey.sleep(222);

      // Fill in all teh data!
      const fields = [...document.querySelectorAll("div.cxsrecField")];
      for (div of fields) {
        if (div.closest(".cxsrecTimeline")) continue;

        const input = div.querySelector("input,select,textarea,.ql-editor");
        if (!input) continue;
        const name = div
          .querySelector("span.slds-form-element__label")
          .childNodes[1].textContent.trim();

        let section = null;
        if (div.closest(".cvSection-Educations")) section = "education";
        if (div.closest(".cvSection-WorkExperiences")) section = "work";

        let value = null;
        if (section) {
          const sectionId = findChildId(
            div.closest("#draggable-wrapper"),
            "#draggable-wrapper > div.cvSection",
            div.closest("#draggable-wrapper > div.cvSection")
          );

          value = data?.[section]?.[sectionId]?.[name];
        } else {
          value = data?.[name];
        }

        setValue(input, value);
        await Monkey.sleep(123);
      }
    };

    importButton = Monkey.fab("fa fa-file-archive", "JSON import", async () => {
      const warning =
        "Het geïmporteerde bestand zal het huidige levenswerk overschrijven, zorg dat je met de juiste actie bezig bent";
      if (!confirm(warning)) return;

      // TODO make Monkey.load
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json";
      input.addEventListener("change", (ev) => {
        const file = ev.target.files[0];
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const result = ev.target.result;
          const data = JSON.parse(result);
          if (!data) {
            console.warn(`Could not parse ${result}`);
            return alert(
              "Er ging iets fout met het parsen van het bestand... spijtig"
            );
          }
          importData(data);
        };
        reader.readAsText(file, "UTF-8");
      });
      input.click();
    });
  };
  Monkey.onLocationChange(doStuff);
  doStuff();
});
