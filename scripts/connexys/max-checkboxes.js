import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  const LIMIT = 20;
  document.addEventListener("click", (ev) => {
    const input = ev.target;
    if (input.type !== "checkbox") return;
    const table = input.closest("table");
    if (!table) return;
    const checkedCount = table.querySelectorAll('input[type="checkbox"]:checked').length;
    if (checkedCount > LIMIT) {
      const warning = `Salesforce vindt het vaak lastig om op meer dan ${LIMIT} regels acties uit te voeren, voer eerst je acties uit op de geselecteerde ${LIMIT} regels, daarna mag je weer nieuwe dingen selecteren`;
      alert(warning);
      input.checked = false;
    }
  });
});
