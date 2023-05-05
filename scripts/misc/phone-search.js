import(chrome.runtime.getURL("/lib/monkey-script.js")).then((Monkey) => {
  Monkey.menu("Find 06 Google", () => {
    const defaultName = (
      window.getSelection().toString() || document.title.split(/ [\|\-] /)[0]
    ).trim();
    const name = prompt("Who you wanna stalk?", defaultName);
    if (name) {
      window.open(
        `https://google.com/search?q=${encodeURIComponent(
          name
        )}+AND+"06+OR+31+OR+316+OR+%2B31"`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  });
});
