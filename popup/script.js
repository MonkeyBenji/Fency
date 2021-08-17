"use strict";

import("/lib/core.js").then(async (Monkey) => {
  const toggles = document.querySelector("#toggles");
  const refreshScriptsButton = document.querySelector("#refresh-scripts");
  const refreshPageButton = document.querySelector("#refresh-page");
  const version = chrome.runtime.getManifest().version;
  document.querySelector("#version").textContent = `Fency version ${version}`;

  const displayScripts = async () => {
    const scripts = (await Monkey.sendMessage("getScripts")).sort((a, b) => {
      const folderOrder = a.folder.localeCompare(b.folder);
      if (folderOrder !== 0) return folderOrder;
      return a.name.localeCompare(b.name);
    });
    const toggleScript = async (id, enabled) =>
      await Monkey.sendMessage("toggleScript", { id, enabled });

    toggles.innerHTML = "";
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
        toggleScript(script.id, checkbox.checked);
      });

      label.appendChild(checkbox);
      div.appendChild(label);
      toggles.appendChild(div);
    });
  };
  displayScripts();

  // Refresh buttons
  refreshScriptsButton.addEventListener("click", async () => {
    refreshScriptsButton.disabled = true;
    toggles.textContent = "";
    await Promise.all([
      Monkey.sendMessage("refresh-scripts"),
      Monkey.sleep(1337),
    ]);
    displayScripts();
    refreshScriptsButton.disabled = false;
  });

  refreshPageButton.addEventListener("click", async () => {
    await Monkey.sendMessage("refresh-page");
    window.close();
  });
});
