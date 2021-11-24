import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  const querySelectorWithText = (node, match, text) =>
    [...node.querySelectorAll(match)].filter(
      (node) => node.textContent === text
    )[0];

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

          dom.getElementById("name").textContent = mapping["Roepnaam"];
          dom.getElementById("year").textContent =
            mapping["Geboortedatum"].split(" ")[2];
          dom.getElementById("nationality").textContent =
            mapping["Nationaliteit"];
          dom.getElementById("place").textContent = mapping["Woonplaats"];
          dom.getElementById("drivers-license").textContent =
            mapping["Rijbewijs"];

          // Persoonsprofiel
          const fillMultilineBlock = (block, string) => {
            let lastBlock = block;
            console.log(lastBlock);
            string.split("\n").forEach((line) => {
              lastBlock.querySelector("t").textContent = line;

              const clonedBlock = block.cloneNode(true);
              clonedBlock.removeAttribute("id");
              clonedBlock.querySelector("t").textContent = "";
              block.parentNode.insertBefore(clonedBlock, lastBlock.nextSibling);
              lastBlock = clonedBlock;
            });
          };
          fillMultilineBlock(
            dom.getElementById("profile-block"),
            mapping["Persoonsprofiel"].replaceAll("\n", "\n\n")
          );

          // Opleidingen & Trainingen
          fillMultilineBlock(
            dom.getElementById("education-block"),
            mapping["education"]
              .map(
                ({
                  Opleiding,
                  Startdatum,
                  Einddatum,
                  Instituut,
                  "Overige informatie": info,
                }) => {
                  const range = [
                    Startdatum.split(" ")[2] ?? Startdatum,
                    Einddatum.split(" ")[2] ?? Einddatum,
                  ]
                    .filter((x) => x)
                    .join(" - ");
                  return `${range}
${Opleiding}
${Instituut}
${info}`.trim();
                }
              )
              .join("\n\n") + "\n"
          );

          // Werkervaring
          const blockHead = dom.getElementById("work-block");
          const blockBody = blockHead.nextElementSibling;
          const divider = dom.getElementById("work-divider");
          blockHead.setAttribute("id", "");
          divider.setAttribute("id", "");

          blockHead.outerHTML = mapping["work"]
            .map((work) => {
              const range = [
                work.Startdatum.split(" ").slice(1).join(" ") ??
                  work.Startdatum,
                work.Einddatum.split(" ").slice(1).join(" ") ?? work.Einddatum,
              ]
                .filter((x) => x)
                .join(" - ");

              // Body is multiline
              const bodyClone = blockBody.cloneNode(true);
              const r = bodyClone.querySelector("r");
              r.outerHTML = work.Beschrijving.split("\n")
                .map((line) => r.outerHTML.replace("Werkervaring", line))
                .join("\n<w:br/>\n");

              return (
                blockHead.outerHTML
                  .replace("Functie", work.Functietitel)
                  .replace("Werkgever", work.Werkgever)
                  .replace("Periode", range) + bodyClone.outerHTML
              );
            })
            .join(divider.outerHTML);
          blockBody.outerHTML = "";
          divider.outerHTML = "";

          // const blockHeadTemplate = dom
          //   .getElementById("function-block")
          //   .cloneNode(true);
          // const blockBodyTemplate = a;
          // for (let i = 0; i < mapping["work"].length; i++) {
          //   const work = mapping["work"][i];
          //   const blockHead = dom.getElementById("function-block");
          //   const blockBody = blockHead.nextElementSibling;

          //   querySelectorWithText(blockHead, "t", "Functie").textContent =
          //     work.Functietitel;
          //   querySelectorWithText(blockHead, "t", "Nederland").textContent =
          //     work.Werkgever; // TODO Nederland ==> Werkgever
          //   querySelectorWithText(
          //     blockHead,
          //     "t",
          //     "periode"
          //   ).textContent = `${work.Startdatum} - ${work.Einddatum}`;

          //   fillMultilineBlock(blockBody, work.Beschrijving);
          //   break;

          //   if (i !== mapping["work"].length - 1) {
          //     // Add divider
          //   }
          // }

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
