import(chrome.runtime.getURL("/lib/monkey-script.js")).then((Monkey) => {
  Monkey.menu("Untappd lookup", async () => {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return alert("Select beers first");

    const getTextNodesBetween = (
      ancestor,
      a,
      b,
      found = { a: false, b: false }
    ) => {
      const nodes = [];
      for (const child of ancestor.childNodes) {
        if (child === a) found.a = true;
        if (found.b) break;
        if (child === b) found.b = true;
        if (child instanceof Text) {
          if (found.a) nodes.push(child);
        } else {
          for (const node of getTextNodesBetween(child, a, b, found)) {
            nodes.push(node);
          }
        }
      }
      return nodes;
    };

    const range = selection.getRangeAt(0);
    const beerNodes = getTextNodesBetween(
      range.commonAncestorContainer,
      range.startContainer,
      range.endContainer
    ).filter((t) => t.textContent.trim().length > 2);

    for (const beerNode of beerNodes) {
      const name = beerNode.textContent.trim();
      // Rip&parse data from Untappd
      const url = `https://untappd.com/search?q=${encodeURIComponent(name)}`;
      let html = await Monkey.fetchText(url);
      const beerIdx = html.indexOf('<div class="beer-item ');
      if (beerIdx === -1) {
        console.log(`404 ${name} not found`, url);
        continue;
      }
      html = html.substring(beerIdx);
      let href = html.substring(html.indexOf('<p class="name'));
      href = href.substring(href.indexOf('<a href="'));
      href = href.substring(0, 1337);
      href = href.split('"')[1];
      href = `https://untappd.com/${href}`;
      let rating = html.substring(html.indexOf('data-rating="'));
      rating = rating.substring(0, 1337);
      rating = rating.split('"')[1];

      const a = document.createElement("a");
      a.href = href;
      a.textContent = ` (🍺${rating})`;
      a.style.fontSize = "0.75rem";
      beerNode.after(a);

      await Monkey.sleep(250);
    }
  });
});
