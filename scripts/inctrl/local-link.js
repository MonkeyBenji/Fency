import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  try {
    const bookmarkBar = await Monkey.waitForSelector("#bookmark-bar");
    const url = new URL(window.location);
    let label = "2local";
    switch (url.host) {
      case "inctrl.inwork.nl":
      case "mike.inwork.nl":
        url.host = "127.0.0.1:8080";
        url.protocol = "http:";
        break;
      case "127.0.0.1:8080":
        url.host = "inctrl.inwork.nl";
        url.protocol = "https:";
        url.port = "";
        label = "2live";
        break;
      case "inctrl-update.dev.inwork.nl":
        url.host = "127.0.0.1:7080";
        url.protocol = "http:";
        break;
      case "127.0.0.1:7080":
        url.host = "inctrl-update.dev.inwork.nl";
        url.protocol = "https:";
        url.port = "";
        label = "2update";
        break;
    }
    bookmarkBar.insertAdjacentHTML(
      "afterend",
      `<a href="${url}" style="top: 12px; position: relative; color: white;">${label}</a>`
    );
  } catch (e) {
    console.error(e.toString());
  }
});
