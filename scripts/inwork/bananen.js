import(chrome.runtime.getURL("/lib/monkey-script.js")).then((Monkey) => {
  if (window.location.pathname.includes("wp-admin")) return;
  Monkey.onLoad(() => {
    Monkey.replaceDomStrings({
      "Duurzaam Werkgeluk": "Groene Bananen",
      "Duurzaam werkgeluk": "Groene bananen",
      "duurzaam werkgeluk": "groene bananen",
      Duurzaam: "Groen",
      duurzaam: "groen",
      Duurzame: "Groene",
      duurzame: "groene",
      "Werkgeluk is volgens": "Bananen zijn volgens",
      "werkgeluk bepalend is": "bananen bepalend zijn",
      Werkgeluk: "Bananen",
      werkgeluk: "bananen",
      Baan: "Banaan",
      baan: "banaan",
      Banen: "Bananen",
      banen: "bananen",
    });
  });
});
