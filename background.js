"use strict";

// Get list of scripts
const pathRelative = (oldPath, newPath) =>
  oldPath.split("/").slice(0, -1).join("/") + "/" + newPath;
const resolveScripts = async (path, folder = "") => {
  const scripts = [];
  const runtimePath = browser.runtime.getURL(path);
  const data = await fetch(runtimePath).then((response) => response.json());
  for (const entry of data) {
    if (entry.type === "folder") {
      const subPath = pathRelative(path, entry.path);
      const subScripts = await resolveScripts(subPath, entry.name);
      for (const subScript of subScripts) {
        scripts.push(subScript);
      }
    } else if (entry.type === "script") {
      entry.path = pathRelative(path, entry.path);
      entry.folder = folder;
      scripts.push(entry);
    }
  }
  return scripts;
};

// Start up stuff
(async () => {
  const scripts = await resolveScripts("scripts/index.json");
  const toggles = (await browser.storage.local.get("toggles")).toggles ?? {};

  // Handle content script register/unregister
  const registrations = {};
  const register = async (id) => {
    if (id in registrations) return;
    const script = scripts.find((script) => script.id === id);
    if (!script) throw `No script ${id}`;
    const matches =
      typeof script.matches === "string" ? [script.matches] : script.matches;

    registrations[script.id] = await browser.contentScripts.register({
      matches,
      js: [{ file: script.path }],
      allFrames: script.allFrames ?? false,
    });
  };
  const unregister = async (id) => {
    if (!(id in registrations)) return;
    await registrations[id].unregister();
    delete registrations[id];
  };

  // Set enabled and register enabled scripts
  for (const script of scripts) {
    if (script.id in toggles) {
      script.enabled = toggles[script.id];
    }
    if (script.enabled) {
      register(script.id);
    }
  }

  // Handle messages from popup and stuff
  const onMessage = ({ fun, args }, sender) => {
    if (fun === "toggleScript") {
      const enabled = args.enabled;
      if (enabled) {
        register(args.id);
      } else {
        unregister(args.id);
      }
      toggles[args.id] = enabled;
      browser.storage.local.set({ toggles });
      const script = scripts.find((script) => script.id === args.id);
      script.enabled = toggles[args.id];
    } else if (fun === "getScripts") {
      return Promise.resolve(scripts);
    } else if (fun === "refresh") {
      browser.tabs
        .query({ active: true, windowId: browser.windows.WINDOW_ID_CURRENT })
        .then(([tab]) =>
          tab ? browser.tabs.reload(tab.id) : alert("No work today, try F5")
        );
    } else if (fun === "type") {
      if (typeof chrome.debugger === "undefined") {
        alert("Chrome.debugger not supported, sowwy");
        return;
      }

      return new Promise((resolve) => {
        const target = { tabId: sender.tab.id };
        const text = args.text;

        chrome.debugger.attach(target, "1.2", () => {
          const keyStrokePromises = text.split("").map(
            (char) =>
              new Promise((resolve) => {
                chrome.debugger.sendCommand(
                  target,
                  "Input.dispatchKeyEvent",
                  {
                    type: "keyDown",
                    text: char === "\n" ? "\r\n" : char,
                  },
                  resolve
                );
              })
          );
          Promise.all(keyStrokePromises).then(() => {
            chrome.debugger.detach(target);
            resolve();
          });
        });
      });
    } else if (fun === "closeTab") {
      browser.tabs.remove(sender.tab.id);
    } else {
      throw `Unexpected fun ${fun}`;
    }
  };

  browser.runtime.onMessage.addListener(onMessage);
})();
