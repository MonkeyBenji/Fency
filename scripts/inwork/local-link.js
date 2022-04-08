import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  try {
    const logo = await Monkey.waitForSelector("a.navbar-brand");
    const url = new URL(window.location);
    let label = "2local";
    if (url.protocol === "http:") {
      url.host = "inwork.nl";
      url.protocol = "https:";
      url.port = "";
      label = "2live";
    } else {
      url.host = "127.0.0.1:8088";
      url.protocol = "http:";
    }
    logo.insertAdjacentHTML(
      "afterend",
      `<a href="${url}" style="top: 8px; position: relative;">${label}</a>`
    );
  } catch (e) {
    console.error(e.toString());
  }
});
