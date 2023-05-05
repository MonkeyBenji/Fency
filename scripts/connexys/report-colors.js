import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  const headerSelector =
    "table.data-grid-full-table th.data-grid-header-cell span.lightning-table-cell-measure-header-value";
  await Monkey.waitForSelector(headerSelector);
  const headers = [...document.querySelectorAll(headerSelector)];
  const colorColId = headers
    .find(({ textContent }) => textContent.toLowerCase().includes("kleur"))
    ?.closest("th")?.dataset?.columnIndex;
  if (!colorColId) return;
  const table = document.querySelector("table.data-grid-full-table");
  Monkey.css(`
  table.data-grid-full-table tr.yellow td {
    background-color: rgba(255, 255, 0, 0.5);
  }
  table.data-grid-full-table tr.red td {
    background-color: rgba(255, 0, 0, 0.5);
  }
`);
  let scrollTimer = null;
  colorizeTable = () => {
    scrollTimer = null;
    table.querySelectorAll("tr:not(.data-grid-header-row)").forEach((tr) => {
      const colorTd = tr.querySelector(`td[data-column-index="${colorColId}"]`);
      let cls = null;
      switch (colorTd?.textContent.toLowerCase().trim()) {
        case "rood":
          cls = "red";
          break;
        case "geel":
          cls = "yellow";
          break;
      }
      if (cls !== null) {
        tr.classList.add(cls);
      }
    });
  };
  colorizeTable();
  document.addEventListener(
    "scroll",
    () => {
      if (scrollTimer !== null) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(colorizeTable, 250);
    },
    { capture: true, passive: true }
  );
});
