import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  if (typeof Monkey.lib === "undefined") return;
  let thisButton = null;

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
    mapping.education = mapping.education.slice(mapping.education.length / 2);
    mapping.work = mapping.work.slice(mapping.work.length / 2);
    return mapping;
  };

  const doStuff = async () => {
    if (thisButton !== null) {
      thisButton.unregister();
      thisButton = null;
    }

    // Page == CV Generator
    try {
      if (window.location.pathname !== "/one/one.app") return;
      const oneApp = JSON.parse(atob(window.location.hash.slice(1)));
      if (oneApp.componentDef !== "cxsrec:CVGenerator") return;
    } catch (e) {
      return;
    }

    thisButton = Monkey.fab(
      "fa fa-file-word",
      "Word CV'tje genereren",
      async () => {
        await Monkey.lib("jszip");
        fetch("https://fency.dev/misc/InWorkStandard2.php")
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
            const pEducation = selectorByText(dom, "t", "Opleiding").closest(
              "p"
            );
            const pEducationYear = pEducation.previousElementSibling;
            const pEducationTitle =
              pEducationYear.previousElementSibling.previousElementSibling;
            const pCertificate = selectorByText(
              dom,
              "t",
              "Certificaat"
            ).closest("p");
            const pCertificateYear = pCertificate.previousElementSibling;
            const pCertificateTitle =
              pCertificateYear.previousElementSibling.previousElementSibling;
            const pWork = selectorByText(dom, "t", "Werkgever").closest("p");
            const pWork2 = pWork.nextElementSibling;
            const pWorkDivider = pWork2.nextElementSibling;

            // Single line replacements
            tName.textContent = mapping["Roepnaam"];
            tYear.textContent = mapping["Geboortedatum"].split(" ")[2];
            tPlace.textContent = mapping["Woonplaats"];
            tDriversLicense.textContent = mapping["Rijbewijs"];

            // Persoonsprofiel
            const wordNewLinesAndEscape = (s) =>
              s
                .replaceAll("&", "&amp;")
                .replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;")
                .replaceAll("\n", "</w:t>\n<w:br/>\n<w:t>");

            const persoonsProfiel = mapping["Persoonsprofiel"] ?? "";
            pProfile.outerHTML = pProfile.outerHTML.replace(
              "Hallo",
              wordNewLinesAndEscape(
                persoonsProfiel.replaceAll("\n", "\n\n") + "\n"
              )
            );

            // Opleidingen
            const educations = mapping["education"].filter(
              (edu) => edu["Is certificaat"] === null
            );
            const certificates = mapping["education"].filter(
              (edu) => edu["Is certificaat"] !== null
            );
            pEducation.outerHTML = educations
              .map((education, i) => {
                const period = formatPeriod(
                  education.Startdatum,
                  education.Einddatum,
                  false
                );
                const educationWithLevel = education.Niveau
                  ? `${education.Opleiding} (${education.Niveau})`
                  : education.Opleiding;
                const body =
                  `${educationWithLevel}
${education.Instituut}
${education["Overige informatie"]}`.trim() +
                  (i < educations.length - 1 ? "\n" : "");
                return (
                  pEducationYear.outerHTML.replace("1980", period) +
                  pEducation.outerHTML.replace(
                    "Opleiding",
                    wordNewLinesAndEscape(body)
                  )
                );
              })
              .join("\n");
            pEducationYear.outerHTML = "";

            // Certificaten
            pCertificate.outerHTML = certificates
              .map((education, i) => {
                const period = formatPeriod(
                  education.Startdatum,
                  education.Einddatum,
                  false
                );
                const educationWithLevel = education.Niveau
                  ? `${education.Opleiding} (${education.Niveau})`
                  : education.Opleiding;
                const body =
                  `${educationWithLevel}
${education.Instituut}
${education["Overige informatie"]}`.trim() +
                  (i < certificates.length - 1 ? "\n" : "");
                return (
                  pCertificateYear.outerHTML.replace("1990", period) +
                  pCertificate.outerHTML.replace(
                    "Certificaat",
                    wordNewLinesAndEscape(body)
                  )
                );
              })
              .join("\n");
            pCertificateYear.outerHTML = "";

            if (educations.length === 0) {
              pEducationTitle.nextElementSibling.outerHTML = "";
              pEducationTitle.outerHTML = "";
            }
            if (certificates.length === 0) {
              pCertificateTitle.nextElementSibling.outerHTML = "";
              pCertificateTitle.outerHTML = "";
            }

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
  };
  Monkey.onLocationChange(doStuff);
  doStuff();
});
