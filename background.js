"use strict";

const SUBSCRIPTIONS_DEFAULT = [
  { url: browser.runtime.getURL("scripts/index.json"), enabled: true },
  { url: browser.runtime.getURL("scripts/samples.json"), enabled: true },
  { url: browser.runtime.getURL("scripts/inwork.json"), enabled: true },
  { url: browser.runtime.getURL("scripts/extra.json"), enabled: true },
  { url: browser.runtime.getURL("scripts/admin.json"), enabled: true },
];

const TOGGLES = "toggles";
const SUBSCRIPTIONS = "subscriptions";
const LAST_SCRIPT_REFRESH_TS = "lastScriptRefreshTS";

import("/lib/core.js").then(
  async ({ set, get, sendMessage, pathRelative, fetchCached }) => {
    let fencyEnabled = await get("enabled", true);
    let scripts = [];
    const subscriptions = await get(SUBSCRIPTIONS, SUBSCRIPTIONS_DEFAULT);
    const toggles = await get(TOGGLES, {});
    const registrations = {};
    if (new Date().toJSON().split("T")[0] >= "2022-12-01") {
      subscriptions.forEach((subscription) => (subscription.enabled = false));
    }

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
        await disableSubscription(subscription.url);
        await enableSubscription(subscription.url, true);
      }
      await set(LAST_SCRIPT_REFRESH_TS, Date.now());
    };

    for (const subscription of subscriptions) {
      if (!subscription.enabled) continue;
      enableSubscription(subscription.url);
    }

    const setFencyEnabled = async (enabled) => {
      fencyEnabled = enabled;
      set("enabled", fencyEnabled);
      scripts
        .filter(({ enabled }) => enabled)
        .forEach((script) => {
          if (fencyEnabled) {
            register(script.id);
          } else {
            unregister(script.id);
          }
        });
      if (fencyEnabled) {
        chrome.browserAction.setIcon({ path: "/icons/icon32.png" });
      } else {
        chrome.browserAction.setIcon({ path: "/icons/icon32_disabled.png" });
      }
    };

    // tabMenusMap[TAB_ID][MENU_I] = TITLE;
    const tabMenusMap = [];
    const buildContextMenuForTab = (tabId) => {
      chrome.contextMenus.removeAll();
      (tabMenusMap[tabId] ?? []).forEach((title, menuI) => {
        chrome.contextMenus.create({
          contexts: ["all"],
          title,
          onclick: () => {
            chrome.tabs.sendMessage(tabId, {
              fun: "menu",
              args: { index: menuI },
            });
          },
        });
      });
    };

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
        set(TOGGLES, toggles);
        const script = scripts.find((script) => script.id === args.id);
        script.enabled = toggles[args.id];
      } else if (fun === "enabled") {
        if (args && "enabled" in args) {
          setFencyEnabled(args.enabled);
        }
        return Promise.resolve(fencyEnabled);
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
        set(SUBSCRIPTIONS, subscriptions);
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
            tab
              ? browser.tabs.reload(tab.id, { bypassCache: true })
              : alert("No work today, try F5")
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
      } else if (fun === "menu") {
        // tabMenusMap[TAB_ID][MENU_I] = TITLE;
        const tabId = sender.tab.id;
        if (typeof tabMenusMap[tabId] === "undefined") tabMenusMap[tabId] = [];
        const menuI = tabMenusMap[tabId].length;
        tabMenusMap[tabId][menuI] = args.title;
        buildContextMenuForTab(tabId);
        return Promise.resolve(menuI);
      } else if (fun === "closeTab") {
        browser.tabs.remove(sender.tab.id);
      } else if (fun === "fetchData") {
        return new Promise((resolve, reject) => {
          fetch(args.resource, args.init)
            .then((res) => res.blob())
            .then((blob) => {
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onloadend = () => resolve(reader.result);
            })
            .catch(reject);
        });
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
    // Context menu stuff
    browser.webNavigation.onCommitted.addListener(({ tabId, frameId }) => {
      if (frameId !== 0) return;
      chrome.contextMenus.removeAll();
      tabMenusMap[tabId] = [];
    });
    chrome.tabs.onActivated.addListener(({ tabId }) => {
      buildContextMenuForTab(tabId);
    });

    // Auto update
    const getNextTime = (h = 0, m = 0, s = 0, ms = 0) => {
      const d = new Date();
      const [cH, cM, cS, cMs] = [
        d.getHours(),
        d.getMinutes(),
        d.getSeconds(),
        d.getMilliseconds(),
      ];

      const curTime = cH * 60 * 60 * 1000 + cM * 60 * 1000 + cS * 1000 + cMs;
      const newTime = h * 60 * 60 * 1000 + m * 60 * 1000 + s * 1000 + ms;

      return (
        d.getTime() +
        (newTime - curTime) +
        (newTime <= curTime ? 24 * 60 * 60 * 1000 : 0)
      );
    };
    const getTimeTillNextTime = (h = 0, m = 0, s = 0, ms = 0) =>
      getNextTime(h, m, s, ms) - Date.now();

    const autoUpdate = async () => {
      await refreshScripts();
      updateAt1337();
    };
    const updateAt1337 = () => {
      const s = Math.floor(Math.random() * 60);
      const ms = Math.floor(Math.random() * 1000);
      let delay = getTimeTillNextTime(13, 37, s, ms);
      if (delay < 60 * 1000) delay += 24 * 60 * 60 * 1000;
      setTimeout(autoUpdate, delay);
    };

    const lastUpdateTS = await get(LAST_SCRIPT_REFRESH_TS, 0);
    if (Date.now() - lastUpdateTS > 24 * 60 * 60 * 1000) {
      setTimeout(autoUpdate, 1337);
    } else {
      updateAt1337();
    }
  }
);
