document.addEventListener(
  "input",
  (ev) => {
    const target = ev.target;
    if (!target.matches('input[inputmode="decimal"]')) return;
    if (!target.value.includes(".")) return;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    target.value = target.value.replace(".", ",");
    target.selectionStart = start;
    target.selectionEnd = end;
  },
  { capture: true }
);
