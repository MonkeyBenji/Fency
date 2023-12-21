"use strict";

const LAST_SCRIPT_REFRESH_TS = "lastScriptRefreshTS";

import("/lib/core.js").then(async (Monkey) => {
  const toggles = document.querySelector("#toggles");
  const refreshScriptsButton = document.querySelector("#refresh-scripts");
  const refreshPageButton = document.querySelector("#refresh-page");
  const enabledToggle = document.querySelector("#enabled-toggle");
  const version = chrome.runtime.getManifest().version;
  document.querySelector("#version").textContent = `Fency version ${version}`;

  const displayScripts = async () => {
    const scripts = (await Monkey.sendMessage("getScripts")).sort((a, b) => {
      const folderOrder = a.folder.localeCompare(b.folder);
      if (folderOrder !== 0) return folderOrder;
      return a.name.localeCompare(b.name);
    });
    const toggleScript = async (id, enabled) => await Monkey.sendMessage("toggleScript", { id, enabled });

    toggles.textContent = "";
    let prevFolder = "";
    if (scripts.length === 0) {
      toggles.textContent = "No scripts found, check subscriptions";
    }
    scripts.forEach((script) => {
      // Add folder element
      if (script.folder !== prevFolder) {
        const h1 = document.createElement("h1");
        h1.textContent = script.folder;
        toggles.append(h1);
        prevFolder = script.folder;
      }

      // Add toggle
      const div = document.createElement("div");
      const label = document.createElement("label");
      label.textContent = script.name;
      label.title = script.description;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = script.enabled;
      checkbox.addEventListener("change", () => {
        refreshPageButton.classList.add("blinking");
        toggleScript(script.id, checkbox.checked);
      });
      label.addEventListener("dblclick", () => {
        window.open(script.path);
      });

      label.appendChild(checkbox);
      div.appendChild(label);
      toggles.appendChild(div);
    });
  };
  displayScripts();

  // Refresh buttons
  refreshScriptsButton.addEventListener("click", async () => {
    refreshScriptsButton.setAttribute("title", "");
    refreshScriptsButton.disabled = true;
    toggles.textContent = "";
    await Promise.all([Monkey.sendMessage("refresh-scripts"), Monkey.sleep(1337)]);
    displayScripts();
    refreshScriptsButton.disabled = false;
  });

  let enabled = await Monkey.sendMessage("enabled");
  enabledToggle.checked = enabled; // TODO spawn with checked = true, now animates
  toggles.classList.toggle("disabled", !enabled);
  enabledToggle.addEventListener("click", async () => {
    enabled = enabledToggle.checked;
    await Monkey.sendMessage("enabled", { enabled });
    toggles.classList.toggle("disabled", !enabled);
  });

  refreshPageButton.addEventListener("click", async () => {
    await Monkey.sendMessage("refresh-page");
    window.close();
  });

  Monkey.get(LAST_SCRIPT_REFRESH_TS).then((lastUpdateTS) => {
    if (lastUpdateTS) {
      const formatted = new Date(lastUpdateTS).toLocaleString("en-UK", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
      });
      refreshScriptsButton.setAttribute(
        "title",
        refreshScriptsButton.getAttribute("title") + ` (Last update ${formatted})`
      );
    }
  });
});
