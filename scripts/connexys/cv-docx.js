import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
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

  const doStuff = async () => {
    // Page == CV Generator
    try {
      if (window.location.pathname !== "/one/one.app") return;
      const oneApp = JSON.parse(atob(window.location.hash.slice(1)));
      if (oneApp.componentDef !== "cxsrec:CVGenerator") return;
    } catch (e) {
      return;
    }

    // TODO Monkey.save
    function saveAs(blob, filename) {
      if (typeof navigator.msSaveOrOpenBlob !== "undefined") {
        return navigator.msSaveOrOpenBlob(blob, fileName);
      } else if (typeof navigator.msSaveBlob !== "undefined") {
        return navigator.msSaveBlob(blob, fileName);
      } else {
        var elem = window.document.createElement("a");
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;
        elem.style = "display:none;opacity:0;color:transparent;";
        (document.body || document.documentElement).appendChild(elem);
        if (typeof elem.click === "function") {
          elem.click();
        } else {
          elem.target = "_blank";
          elem.dispatchEvent(
            new MouseEvent("click", {
              view: window,
              bubbles: true,
              cancelable: true,
            })
          );
        }
        URL.revokeObjectURL(elem.href);
      }
    }

    Monkey.fab("fa fa-file-word", "Word CV'tje genereren", async () => {
      await import(chrome.runtime.getURL("/lib/jszip.js"));
      fetch(chrome.runtime.getURL("/misc/InWorkStandard.docx"))
        .then((response) => response.blob())
        .then(JSZip.loadAsync)
        .then(async (zip) => {
          // Rip fields from Connexys CV gen wizard and put them in a mapping
          const mapping = [...document.querySelectorAll("div.cxsrecField")]
            .map((div) => {
              const input = div.querySelector("input,select,textarea");
              if (!input) return null;
              const name = div
                .querySelector("span.slds-form-element__label")
                .childNodes[1].textContent.trim();
              const value = div.matches(".cxsField_RICHTEXT")
                ? div
                    .querySelector(".ql-editor")
                    .innerText.replaceAll("\n\n\n\n\n", "\n\n\n\n")
                    .replaceAll("\n\n", "\n")
                : input.value;
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
          mapping.education = mapping.education.slice(
            0,
            mapping.education.length / 2
          );
          mapping.work = mapping.work.slice(0, mapping.work.length / 2);

          // Replace word content
          const xml = await zip.file("word/document.xml").async("string");
          const dom = new DOMParser().parseFromString(xml, "text/xml");

          // Find <w:t> node references in document.xml DOM
          const tName = selectorByText(dom, "t", "Roepnaam");
          const tYear = selectorByText(dom, "t", "1970");
          const tNationality = selectorByText(dom, "t", "Friese");
          const tPlace = selectorByText(dom, "t", "Hollum");
          const tDriversLicense = selectorByText(dom, "t", "Soms");
          const pProfile = selectorByText(dom, "t", "Hallo").closest("p");
          const pEducation = selectorByText(dom, "t", "Opleiding").closest("p");
          const pEducationYear = pEducation.previousElementSibling;
          const pWork = selectorByText(dom, "t", "Werkgever").closest("p");
          const pWork2 = pWork.nextElementSibling;
          const pWorkDivider = pWork2.nextElementSibling;

          // Single line replacements
          tName.textContent = mapping["Roepnaam"];
          tYear.textContent = mapping["Geboortedatum"].split(" ")[2];
          tNationality.textContent = mapping["Nationaliteit"];
          tPlace.textContent = mapping["Woonplaats"];
          tDriversLicense.textContent = mapping["Rijbewijs"];

          // Persoonsprofiel
          const wordNewLines = (s) =>
            s.replaceAll("\n", "</w:t>\n<w:br/>\n<w:t>");

          pProfile.outerHTML = pProfile.outerHTML.replace(
            "Hallo",
            wordNewLines(mapping["Persoonsprofiel"].replaceAll("\n", "\n\n"))
          );

          // Opleidingen & Trainingen
          pEducation.outerHTML = mapping["education"]
            .map((education) => {
              const period = formatPeriod(
                education.Startdatum,
                education.Einddatum,
                false
              );
              const body = `${education.Opleiding}
${education.Instituut}
${education["Overige informatie"]}`.trim();
              return (
                pEducationYear.outerHTML.replace("1980", period) +
                pEducation.outerHTML.replace(
                  "Opleiding",
                  wordNewLines(body + "\n")
                )
              );
            })
            .join("\n");
          pEducationYear.outerHTML = "";

          // Werkervaring
          let i = 19; // Shapes have id's in Word, need to uniqueify them or Word will start bitchin
          let workHtml = mapping["work"]
            .map((work) => {
              const period = formatPeriod(
                work.Startdatum,
                work.Einddatum,
                true
              );

              return (
                pWork.outerHTML
                  .replace("Functie", work.Functietitel)
                  .replace("Werkgever", work.Werkgever)
                  .replace("Periode", period) +
                pWork2.outerHTML.replace(
                  "Werkzaamheden",
                  wordNewLines(work.Beschrijving)
                )
              );
            })
            .join(pWorkDivider.outerHTML);
          workHtml = workHtml.replaceAll(
            '<wp:docPr id="19"',
            `<wp:docPr id="${i++}"`
          ); // TODO, make this work
          pWork.outerHTML = workHtml;
          console.log(workHtml);
          pWork2.outerHTML = "";
          pWorkDivider.outerHTML = "";

          zip.file(
            "word/document.xml",
            new XMLSerializer().serializeToString(dom)
          );

          zip
            .generateAsync({ type: "blob" })
            .then((content) => saveAs(content, "cv.docx"));
        });
    });
  };

  Monkey.onLocationChange(doStuff);
  doStuff();
});

// const canvas = document.createElement("canvas");
// canvas.width = 200;
// canvas.height = 200;
// const context = canvas.getContext("2d");
// const image = new Image();

// image.onload = () => {
//   var sourceX = 0;
//   var sourceY = 0;
//   var sourceWidth = 150;
//   var sourceHeight = 150;
//   var destWidth = sourceWidth;
//   var destHeight = sourceHeight;
//   var destX = canvas.width / 2 - destWidth / 2;
//   var destY = canvas.height / 2 - destHeight / 2;

//   context.drawImage(
//     image,
//     sourceX,
//     sourceY,
//     sourceWidth,
//     sourceHeight,
//     destX,
//     destY,
//     destWidth,
//     destHeight
//   );

//   console.log(123, canvas.toDataURL("image/png"));
// };
// const data = await Monkey.fetchText(
//   "https://inwork--c.eu38.content.force.com/servlet/servlet.FileDownload?file=00P1n00002fOmgOEAS"
// );
// console.log(`data:image/jpeg,${data}`);
// image.src = `data:image/jpeg,${data}`;
