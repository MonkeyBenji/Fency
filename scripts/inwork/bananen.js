import(chrome.runtime.getURL("/lib/monkey-script.js")).then((Monkey) => {
  if (window.location.pathname.includes("wp-admin")) return;
  Monkey.onLoad(() => {
    Monkey.replaceDomStrings({
      "Duurzaam Werkgeluk": "Groene Bananen",
      "duurzaam werkgeluk": "groene bananen",
      Duurzaam: "Groen",
      duurzaam: "groen",
      Duurzame: "Groene",
      duurzame: "groene",
      Werkgeluk: "Bananen",
      werkgeluk: "bananen",
      baan: "banaan",
    });
  });
});
