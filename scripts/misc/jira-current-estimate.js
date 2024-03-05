import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  if (!window.location.href.includes("/boards/")) return;
  if (!window.location.href.includes("/backlog")) return;
  const sprintContainer = document.getElementById("ak-main-content");
  const projectKey = window.location.pathname.split("/")[5];
  const jql = encodeURIComponent(
    `project = ${projectKey} AND statuscategory != Complete AND sprint IS NOT EMPTY ORDER BY updatedDate DESC`
  );
  const json = await Monkey.fetchText(
    `https://inwork.atlassian.net/rest/api/2/search?jql=${jql}&fields=key,timeoriginalestimate,aggregatetimeestimate&maxResults=100`
  );
  const issuesRemainingEstimates = Object.fromEntries(
    JSON.parse(json).issues.map((issue) => [issue.key, issue.fields.aggregatetimeestimate])
  );
  console.log({ issuesRemainingEstimates });

  const secondsToWDHM = (seconds) => {
    const map = [
      ["w", 5 * 8 * 60 * 60],
      ["d", 8 * 60 * 60],
      ["h", 60 * 60],
      ["m", 60],
    ];
    let ret = {};
    map.forEach(([key, subSeconds]) => {
      const total = Math.floor(seconds / subSeconds);
      seconds -= total * subSeconds;
      ret[key] = total;
    });
    return ret;
  };

  const doIt = () => {
    sprintContainer
      .querySelectorAll('div[data-testid^="software-backlog.card-list.card.content-container."]')
      .forEach((div) => {
        const key = div.dataset.testId.split(".").slice(-1)[0];
        const remaining = issuesRemainingEstimates[key] || null;
        if (remaining === null) return;
        const badge = [...div.querySelectorAll("span")]
          .filter((span) => span.firstChild instanceof Text)
          .filter((span) =>
            span.textContent.split(" ").every((piece) => !isNaN(piece[0]) && isNaN(piece.slice(-1)[0]))
          )[0]?.parentElement;
        if (!badge) return;
        const remainingString =
          remaining === 0
            ? "0m"
            : Object.entries(secondsToWDHM(remaining))
                .filter(([_, amount]) => amount > 0)
                .map(([key, amount]) => `${amount}${key}`)
                .join(" ");
        if (badge.firstElementChild.textContent !== remainingString) {
          badge.firstElementChild.textContent = remainingString;
          badge.style.border = "1px solid #9ac445";
        }
      });
  };
  doIt();
  setTimeout(doIt, 2500);
  document.addEventListener("click", () => setTimeout(doIt, 50));
  document.addEventListener("click", () => setTimeout(doIt, 5000));
  document.addEventListener("scroll", () => setTimeout(doIt, 1337), { capture: true, passive: true });
});
