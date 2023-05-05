import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  if (!window.location.href.includes("/boards/")) return;
  const issues = await Monkey.waitForSelector(
    'a[href$="/issues"],a[href$="/issues/"]'
  );
  const project = issues.href
    .split("/")
    .filter((s) => s)
    .slice(-2)[0];
  const url =
    issues.href + `?jql=project %3D "${project}" ORDER BY updated DESC`;

  Monkey.fetchText(url).then((html) => {
    const parser = new DOMParser();
    const dom = parser.parseFromString(html, "text/html");

    const map = {};
    let age = -1;
    let prevUpdated = null;

    dom.querySelectorAll("tr[data-testid]").forEach((tr) => {
      if (age > 5) return;
      const key = tr.querySelector("a").textContent.trim();
      const updatedCol =
        tr.lastChild.previousElementSibling.previousElementSibling;
      const updated = updatedCol.textContent.trim();
      if (updated !== prevUpdated) {
        age++;
        prevUpdated = updated;
      }
      map[key] = [age, updated];
    });

    const glowIt = () => {
      document
        .querySelectorAll(
          '.ghx-issue,.ReactVirtualized__Grid__innerScrollContainer div[id^="card-"]'
        )
        .forEach((div) => {
          if (div.id && div.id.startsWith("")) {
          } else {
          }
          const key =
            div.id && div.id.startsWith("card-")
              ? div.id.substring(5)
              : div.querySelector("a").dataset.tooltip;
          if (key in map) {
            const [age, updated] = map[key];
            const hue = 150 + age * 25;
            const alpha = 100 - age * 20;
            if (div.id && div.id.startsWith("card-")) {
              div = div.querySelector(
                'div[data-test-id="platform-card.ui.card.focus-container"]'
              );
            }
            div.style.boxShadow = `-8px -8px 16px -8px hsla(${hue}, 60%, 60%, ${alpha}%) inset`;
            div.title = `Last update: ${updated}`;
          }
        });
    };
    glowIt();
    document.addEventListener("click", () => setTimeout(glowIt, 1337));
  });
});
