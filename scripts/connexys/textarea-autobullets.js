document.body.addEventListener("keyup", (ev) => {
  if (ev.key !== "Enter" && ev.key !== "Backspace") return;
  const BULLET = "•       ";
  const textarea = ev.target;
  if (!textarea instanceof HTMLTextAreaElement) return;
  const value = textarea.value;
  const pos = textarea.selectionStart;
  const prevChar = value.substring(pos - 2, pos - 1);

  if (ev.key === "Enter" && prevChar === ":") {
    // Start new bullet list on :<enter>
    textarea.value = value.substring(0, pos) + BULLET + value.substring(pos);
  }

  const prevNewLinePos = value.substring(0, pos - 1).lastIndexOf("\n");
  const firstCharPrevLine = value.substring(
    prevNewLinePos + 1,
    prevNewLinePos + 2
  );
  if (ev.key === "Enter" && firstCharPrevLine === "•") {
    // Continue bullet list on <enter> after line starting with •
    let startPart = value.substring(0, pos - 1);
    if (!startPart.endsWith(";")) startPart += ";";
    textarea.value = startPart + "\n" + BULLET + value.substring(pos);
  }

  if (ev.key === "Backspace" && prevChar === " ") {
    // Remove the bullet on backspace
    const maybeBullet = value.substring(pos - BULLET.length + 1, pos);
    if (maybeBullet === BULLET.substring(0, BULLET.length - 1)) {
      let startPart = value.substring(0, pos - BULLET.length + 1);
      // Change ; into . for the last in line
      if (startPart.endsWith(";\n")) {
        startPart = startPart.substring(0, startPart.length - 2) + ".\n";
      }
      textarea.value = startPart + value.substring(pos);
    }
  }
});
