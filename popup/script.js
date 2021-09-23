"use strict";

import("/lib/core.js").then(async (Monkey) => {
  const toggles = document.querySelector("#toggles");
  const refreshScriptsButton = document.querySelector("#refresh-scripts");
  const refreshPageButton = document.querySelector("#refresh-page");
  const enabledToggle = document.querySelector("#enabled-toggle");
  const updateButton = document.querySelector("#update-button");
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
    refreshScriptsButton.disabled = true;
    toggles.textContent = "";
    await Promise.all([
      Monkey.sendMessage("refresh-scripts"),
      Monkey.sleep(1337),
    ]);
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

  // Update status
  const AUTO_UPDATE_INTERVAL = 24 * 60 * 60 * 1000;
  const LOADING = 0;
  const UPDATE_AVAILABLE = 1;
  const THROTTLED = 2;
  const UP_TO_DATE = 3;
  let updateStatus = UP_TO_DATE;
  let lastUpdated = await Monkey.get("lastUpdated", 0);

  const updateClassReset = () => {
    updateButton.classList.remove("success");
    updateButton.classList.remove("error");
    updateButton.classList.remove("spin");
  };
  const updateIsAvailable = async () => {
    updateStatus = UPDATE_AVAILABLE;
    updateButton.innerHTML = await Monkey.getFaSvg("arrow-alt-up");
    updateClassReset();
    updateButton.classList.add("success");
  };
  const isUpToDate = async () => {
    updateStatus = UP_TO_DATE;
    updateButton.innerHTML = await Monkey.getFaSvg("check");
    updateClassReset();
    updateButton.classList.add("success");
  };
  const updateThrottled = async () => {
    updateStatus = THROTTLED;
    updateButton.innerHTML = await Monkey.getFaSvg("exclamation-triangle");
    updateClassReset();
    updateButton.classList.add("error");
  };
  const updateDoLoading = async () => {
    updateStatus = LOADING;
    await Monkey.set("lastUpdated", new Date().getTime());
    updateClassReset();
    updateButton.classList.add("spin");
    updateButton.innerHTML = await Monkey.getFaSvg("spinner");
    setTimeout(() => {
      chrome.runtime.requestUpdateCheck((status) => {
        if (status === "update_available") {
          updateIsAvailable();
        } else if (status === "no_update") {
          isUpToDate();
        } else if (status === "throttled") {
          console.error("throttled");
          updateThrottled();
        }
      });
    }, 1337);
  };
  updateButton.addEventListener("click", () => {
    if (updateStatus === LOADING) {
      alert("Rustig jij!");
    } else if (updateStatus === UPDATE_AVAILABLE) {
      console.log("reload!");
      chrome.runtime.reload();
    } else if (updateStatus === THROTTLED) {
      updateDoLoading();
    } else if (updateStatus === UP_TO_DATE) {
      updateDoLoading();
    }
  });
  if (new Date().getTime() - lastUpdated > AUTO_UPDATE_INTERVAL) {
    updateDoLoading();
  } else {
    isUpToDate();
  }

  refreshPageButton.addEventListener("click", async () => {
    await Monkey.sendMessage("refresh-page");
    window.close();
  });
});
