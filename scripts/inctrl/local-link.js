import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  try {
    const bookmarkBar = await Monkey.waitForSelector("#bookmark-bar");
    const url = new URL(window.location);
    let label = "2local";
    if (url.protocol === "http:") {
      url.host = "inctrl.inwork.nl";
      url.protocol = "https:";
      url.port = "";
      label = "2live";
    } else {
      url.host = "127.0.0.1:8080";
      url.protocol = "http:";
    }
    bookmarkBar.insertAdjacentHTML(
      "afterend",
      `<a href="${url}" style="top: 12px; position: relative; color: white;">${label}</a>`
    );
  } catch (e) {
    console.error(e.toString());
  }
});
