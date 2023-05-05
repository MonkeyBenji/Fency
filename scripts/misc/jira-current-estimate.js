import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  if (!window.location.href.includes("/boards/")) return;
  if (!window.location.href.includes("/backlog")) return;
  const sprintContainer = await Monkey.waitForSelector(
    "div.ghx-backlog-container[data-sprint-id]"
  );
  const sprintId = sprintContainer.dataset.sprintId;
  const json = await Monkey.fetchText(
    `https://inwork.atlassian.net/rest/api/2/search?jql=sprint %3D ${sprintId}&fields=key,timeoriginalestimate,aggregatetimeestimate&maxResults=100`
  );
  const issuesRemainingEstimates = Object.fromEntries(
    JSON.parse(json).issues.map((issue) => [
      issue.key,
      issue.fields.aggregatetimeestimate,
    ])
  );

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
    sprintContainer.querySelectorAll("div.js-issue").forEach((div) => {
      const key = div.dataset.issueKey;
      const remaining = issuesRemainingEstimates[key];
      if (remaining === null) return;
      const badge = div.querySelector(".ghx-statistic-badge");
      const remainingString =
        remaining === 0
          ? "0m"
          : Object.entries(secondsToWDHM(remaining))
              .filter(([_, amount]) => amount > 0)
              .map(([key, amount]) => `${amount}${key}`)
              .join(" ");
      if (badge.textContent !== remainingString) {
        badge.textContent = remainingString;
        badge.style.border = "1px solid #9ac445";
      }
    });
  };
  doIt();
  document.addEventListener("click", () => setTimeout(doIt, 50));
  document.addEventListener("click", () => setTimeout(doIt, 5000));
});
