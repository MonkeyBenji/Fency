"use strict";

const SUBSCRIPTIONS_DEFAULT = [
  { url: browser.runtime.getURL("scripts/index.json"), enabled: true },
  { url: browser.runtime.getURL("scripts/common.json"), enabled: true },
  { url: browser.runtime.getURL("scripts/extra.json"), enabled: true },
  { url: browser.runtime.getURL("scripts/admin.json"), enabled: true },
  // { url: "https://fency.dev/scripts/inwork/common.json", enabled: true },
  // { url: "https://fency.dev/scripts/inwork/extra.json", enabled: false },
  // { url: "https://fency.dev/scripts/inwork/admin.json", enabled: false },
];
// TODO remove local stuff in submitted code

import("/lib/core.js").then(
  async ({ set, get, sendMessage, pathRelative, fetchCached }) => {
    let scripts = [];
    const subscriptions = await get("subscriptions!", SUBSCRIPTIONS_DEFAULT);
    // TODO no !
    const toggles = await get("toggles", {});
    const registrations = {};
    if (new Date().toJSON().split("T")[0] >= "2021-10-01") {
      subscriptions.forEach((subscription) => (subscription.enabled = false));
    }

    // TODO move to own lib
    const fetchScripts = async (path, ignoreCache = false) => {
      const scripts = [];
      const data = await fetchCached(path, true, ignoreCache);
      for (const folder in data.scripts) {
        for (const script of data.scripts[folder]) {
          script.folder = folder;
          script.source = path;
          script.path = pathRelative(path, script.path);
          scripts.push(script);
        }
      }
      return scripts;
    };
    const register = async (id, ignoreCache = false) => {
      if (id in registrations) {
        if (ignoreCache) {
          await unregister(id);
        } else {
          return;
        }
      }
      const script = scripts.find((script) => script.id === id);
      if (!script) throw `No script ${id}`;
      const matches =
        typeof script.matches === "string" ? [script.matches] : script.matches;
      const code = await fetchCached(script.path, false, ignoreCache);

      registrations[script.id] = await browser.contentScripts.register({
        matches,
        js: [{ code }],
        allFrames: script.allFrames ?? false,
      });
    };
    const unregister = async (id) => {
      if (!(id in registrations)) return;
      await registrations[id].unregister();
      delete registrations[id];
    };
    // Till here

    const enableSubscription = async (url, ignoreCache = false) => {
      try {
        const myScripts = await fetchScripts(url, ignoreCache);
        scripts.push(...myScripts);
        for (const script of myScripts) {
          if (script.id in toggles) {
            script.enabled = toggles[script.id];
          }
          if (script.enabled) {
            register(script.id, ignoreCache);
          }
        }
      } catch (e) {
        console.warn(`Could not load scripts of ${subscription.url}`, e);
        return;
      }
    };
    const disableSubscription = async (url) => {
      const myScripts = scripts.filter((script) => script.source === url);
      for (const script of myScripts) {
        unregister(script.id);
      }
      scripts = scripts.filter((script) => script.source !== url);
    };

    const refreshScripts = async () => {
      for (const subscription of subscriptions) {
        if (!subscription.enabled) continue;
        console.log(subscription.url);
        await disableSubscription(subscription.url);
        await enableSubscription(subscription.url, true);
      }
    };

    for (const subscription of subscriptions) {
      if (!subscription.enabled) continue;
      enableSubscription(subscription.url);
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
      } else if (fun === "toggleSubscription") {
        const enabled = args.enabled;
        if (enabled) {
          enableSubscription(args.url);
        } else {
          disableSubscription(args.url);
        }
        const subscription = subscriptions.find((sub) => sub.url === args.url);
        subscription.enabled = enabled;
        browser.storage.local.set({ subscriptions });
      } else if (fun === "getSubscriptions") {
        return Promise.resolve(subscriptions);
      } else if (fun === "refresh-scripts") {
        return new Promise(async (resolve) => {
          await refreshScripts();
          resolve();
        });
      } else if (fun === "refresh-page") {
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
      } else if (fun === "fetchText") {
        return new Promise((resolve, reject) => {
          fetch(args.resource, args.init)
            .then((res) => res.text())
            .then(resolve)
            .catch(reject);
        });
      } else if (fun === "fetchJson") {
        return new Promise((resolve, reject) => {
          fetch(args.resource, args.init)
            .then((res) => res.json())
            .then(resolve)
            .catch(reject);
        });
      } else {
        throw `Unexpected fun ${fun}`;
      }
    };

    browser.runtime.onMessage.addListener(onMessage);
  }
);
