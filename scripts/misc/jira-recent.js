import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  if (!window.location.href.includes("/boards/")) return;
  const boardId = window.location.pathname.split("/").slice(-1)[0];
  const activeSprintJson = await Monkey.fetchText(
    `https://inwork.atlassian.net/rest/agile/1.0/board/${boardId}/sprint?state=active`
  );
  const sprintId = JSON.parse(activeSprintJson).values[0].id;
  const json = await Monkey.fetchText(
    `https://inwork.atlassian.net/rest/api/2/search?jql=sprint %3D ${sprintId} ORDER BY updated DESC&fields=key,updated&maxResults=100`
  );
  let prevDate = null;
  let age = -1;

  const map = {};

  JSON.parse(json).issues.forEach((issue) => {
    const key = issue.key;
    const updated = issue.fields.updated;
    const updatedDate = updated.split("T")[0];
    if (updatedDate !== prevDate) {
      prevDate = updatedDate;
      age++;
    }
    if (age > 5) return;
    map[key] = [age, updated];
  });

  const glowIt = () => {
    document.querySelectorAll('div[id^="card-"]').forEach((div) => {
      const key = div.id.substring(5);
      if (key in map) {
        const [age, updated] = map[key];
        const hue = 150 + age * 25;
        const alpha = 100 - age * 20;
        if (div.id && div.id.startsWith("card-")) {
          div = div.querySelector('div[data-test-id="platform-card.ui.card.focus-container"]');
        }
        div.style.boxShadow = `-8px -8px 16px -8px hsla(${hue}, 60%, 60%, ${alpha}%) inset`;
        div.title = `Last update: ${updated}`;
      }
    });
  };
  glowIt();
  document.addEventListener("click", () => setTimeout(glowIt, 1337));
  document
    .querySelector('div[data-testid="platform-board-kit.ui.board.scroll.board-scroll"]')
    .addEventListener("scroll", () => setTimeout(glowIt, 1337), { useCapture: true, passive: true });
});
