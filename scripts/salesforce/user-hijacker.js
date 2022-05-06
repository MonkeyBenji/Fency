import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  // Add dropdown
  setTimeout(async () => {
    try {
      const globalActions = await Monkey.waitForSelector(
        ".slds-global-actions"
      );
      const hijacks = JSON.parse(await Monkey.get("hijacks", "{}")) || {};
      const hijackDropdown = document.createElement("select");
      const lsOptions = Object.entries(hijacks)
        .map(([key, value]) => `<option value="${key}">${value}</option>`)
        .join("");
      const base = window.location.hostname.split(".")[0];
      const options = `<option selected>Hijack</option>${lsOptions}<option value='https://${base}.cloudforce.com/005?isUserEntityOverride=1'>All Users</option>`;
      hijackDropdown.innerHTML = options;
      globalActions.insertBefore(hijackDropdown, globalActions.firstChild);
      hijackDropdown.addEventListener("change", async (e) => {
        if (hijackDropdown.style.backgroundColor === "orange") {
          hijackDropdown.style.backgroundColor = "";
          (async () => {
            const hijacks = JSON.parse(await Monkey.get("hijacks", "{}")) || {};
            delete hijacks[hijackDropdown.value];
            Monkey.set("hijacks", JSON.stringify(hijacks));
          })();
        } else {
          window.location.href = hijackDropdown.value;
        }
      });
      hijackDropdown.addEventListener("auxclick", (e) => {
        if (e.button === 1 || e.button === 2) {
          // Sometimes middle click no works ... iDunnoWhy
          hijackDropdown.style.backgroundColor = "orange";
        }
      });
    } catch (e) {
      console.warn(e.toString());
    }
  }, 42);

  document.addEventListener("auxclick", async (e) => {
    if (e.target.matches('a.actionLink[href*="isUserEntityOverride"]')) {
      const hijacks = JSON.parse(await Monkey.get("hijacks", "{}")) || {};
      hijacks[e.target.getAttribute("href")] =
        e.target.parentNode.nextSibling.innerText.trim();
      Monkey.set("hijacks", JSON.stringify(hijacks));
    }
  });
});
