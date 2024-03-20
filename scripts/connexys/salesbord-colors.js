import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  const doStuff = async () => {
    const isNotOnSalesbordPage = () =>
      !window.location.pathname.includes("lightning/r/Report") ||
      !window.location.pathname.endsWith("/view") ||
      !["00OW7000000rqDOMAY", "00OW7000000762HMAQ", "00OW700000110JxMAI", "00OW70000011TU1MAM"].includes(
        window.location.pathname.split("/")[4]
      );
    if (isNotOnSalesbordPage()) return;
    Monkey.js(() => {
      const isNotOnSalesbordPage = () =>
        !window.location.pathname.includes("lightning/r/Report") ||
        !window.location.pathname.endsWith("/view") ||
        !["00OW7000000rqDOMAY", "00OW7000000762HMAQ", "00OW700000110JxMAI", "00OW70000011TU1MAM"].includes(
          window.location.pathname.split("/")[4]
        );
      const GREEN_DAYS = 2;
      !(function (send) {
        if (XMLHttpRequest.prototype.sendHijacked) return;
        XMLHttpRequest.prototype.sendHijacked = true;
        XMLHttpRequest.prototype.send = function (postData) {
          if (postData) {
            const params = new URLSearchParams(postData);
            if (params.has("message")) {
              const message = JSON.parse(params.get("message"));
              const actions = message?.actions || [];
              actions.forEach((action, i) => {
                const descriptor = action.descriptor;
                if (descriptor?.endsWith("runReport")) {
                  this.addEventListener("loadend", () => {
                    const data = JSON.parse(this.response);
                    const factMap = data?.actions?.[i]?.returnValue?.factMap ?? {};
                    let rowId = 0;
                    const rows = Object.entries(factMap)
                      .sort(([t], [t2]) => t.localeCompare(t2))
                      .map(([_, b]) => b)
                      .map(({ rows }) => rows)
                      .flat();
                    rows.forEach((row) => {
                      const date = row.dataCells.slice(-1)[0].value;
                      employeeLastUpdateMapping[rowId] = date;
                      rowId++;
                    });
                    setTimeout(applySalesbordColors, 1337);
                    const widgets = document
                      .querySelector(".active iframe")
                      .contentDocument.querySelector("table.data-grid-full-table")
                      .closest(".widgets");
                    widgets.addEventListener(
                      "scroll",
                      () => {
                        if (scrollTimer) clearTimeout(scrollTimer);
                        scrollTimer = setTimeout(applySalesbordColors, 123);
                      },
                      { useCapture: true, passive: true }
                    );
                  });
                }
              });
            }
          }
          send.call(this, postData);
        };
      })(XMLHttpRequest.prototype.send);

      let employeeLastUpdateMapping = {};
      let scrollTimer = null;

      const applySalesbordColors = () => {
        if (isNotOnSalesbordPage()) return;
        const supDoc = document.querySelector(".active iframe").contentDocument;
        supDoc.querySelectorAll("tr.data-grid-table-row").forEach((tr) => {
          const rowId = tr.querySelector("td")?.dataset?.rowIndex;
          if (typeof rowId === "undefined") return;
          const updateDate = employeeLastUpdateMapping[rowId];
          let daysAgo = Math.floor((new Date() - new Date(updateDate)) / (1000 * 60 * 60 * 24));
          if (new Date().getDay() === 1 && daysAgo <= 3) {
            daysAgo = 1;
          }
          if (daysAgo > GREEN_DAYS) return;
          const opacity = ((GREEN_DAYS - daysAgo) / GREEN_DAYS / 1.75).toFixed(2);
          tr.querySelectorAll("td").forEach((td) => {
            if (!td.style.backgroundColor) {
              td.style.backgroundColor = `rgba(154, 196, 69, ${opacity})`;
            }
          });
        });
      };
    });
  };
  Monkey.onLocationChange(doStuff);
  doStuff();
});
