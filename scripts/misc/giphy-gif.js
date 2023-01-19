document.addEventListener("contextmenu", (ev) => {
  const img = ev.target;
  if (!img instanceof Image) return;
  if (!img.src.endsWith(".webp")) return;
  img.src = img.src.slice(0, -4) + "gif";
});
