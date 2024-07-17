import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  const doStuff = async () => {
    if (!window.location.pathname.includes("/workspace/pull-requests/")) return;
    await Monkey.waitForSelector('div[data-qa="author-selector"]');
    Monkey.js(() => {
      const authorSelector = document.querySelector('div[data-qa="author-selector"]');
      const hyperlink = document.createElement("a");
      hyperlink.textContent = "Mine";
      hyperlink.title = "Mine, mine, mine, mine!";
      hyperlink.href = `?author=${__app_data__.user.aaid}&user_filter=ALL`;
      const parent = authorSelector.parentElement;
      parent.appendChild(hyperlink);
      const links = parent.querySelectorAll("a");
      if (links.length > 9) {
        links.forEach((link) => (link.outerHTML = ""));
        const img = document.createElement("img");
        img.src = "https://i.giphy.com/kLk1Qa8mrYdQA.webp";
        parent.appendChild(img);
      }
    });
  };
  doStuff();
  Monkey.onLocationChange(doStuff);
});
