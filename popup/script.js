"use strict";

(async () => {
  const sendMessage = (fun, args = undefined) =>
    new Promise((resolve, reject) => {
      const message = { fun };
      if (typeof args !== "undefined") message.args = args;
      chrome.runtime.sendMessage(message, resolve);
    });

  const scripts = await sendMessage("getScripts");
  const toggleScript = async (id, enabled) =>
    await sendMessage("toggleScript", { id, enabled });

  const toggles = document.querySelector("#toggles");
  toggles.innerHTML = "";
  let prevFolder = "";
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

  document.querySelector("#refresh").addEventListener("click", () => {
    sendMessage("refresh");
    window.close();
  });
})();
