import(chrome.runtime.getURL("/lib/monkey-script.js")).then((Monkey) => {
  Monkey.menu("Remove textarea padding", () => {
    const textarea = document.activeElement;
    if (!textarea instanceof HTMLTextAreaElement) {
      return alert(
        "Momenteel worden alleen platte textarea elementen ondersteund. (van die dingen zonder opmaak)"
      );
    }
    textarea.value = textarea.value
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      .replaceAll(/(?<![\.\:\;])\n/g, " ")
      .replaceAll("  ", " ");
  });
});
