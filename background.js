"use strict";

const SUBSCRIPTIONS_DEFAULT = [
  { url: browser.runtime.getURL("scripts/index.json"), enabled: true },
  { url: browser.runtime.getURL("scripts/samples.json"), enabled: true },
  { url: "https://fency.dev/scripts/0.1.0/inwork.json", enabled: true },
  { url: "https://fency.dev/scripts/0.1.0/extra.json", enabled: false },
  { url: "https://fency.dev/scripts/0.1.0/admin.json", enabled: false },
];

const TOGGLES = "toggles";
const SUBSCRIPTIONS = "subscriptions";
const LAST_SCRIPT_REFRESH_TS = "lastScriptRefreshTS";

import("/lib/core.js").then(async ({ set, get, sendMessage, pathRelative, fetchCached }) => {
  let fencyEnabled = await get("enabled", true);
  let scripts = [];
  const subscriptions = await get(SUBSCRIPTIONS, SUBSCRIPTIONS_DEFAULT);
  const toggles = await get(TOGGLES, {});
  const registrations = {};

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
    const matches = typeof script.matches === "string" ? [script.matches] : script.matches;

    let code = null;
    try {
      code = await fetchCached(script.path, false, ignoreCache);
    } catch {
      if (ignoreCache) code = await fetchCached(script.path, false);
      if (!code) return;
    }

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
        if (script.enabled && fencyEnabled) {
          register(script.id, ignoreCache);
        }
      }
    } catch (e) {
      console.warn(`Could not load scripts of ${url}`, e);
      if (ignoreCache === true) await enableSubscription(url, false);
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
        .then(([tab]) => (tab ? browser.tabs.reload(tab.id, { bypassCache: true }) : alert("No work today, try F5")));
    } else if (fun === "type") {
      // TODO: Implement; Chrome version used chrome.debugger.sendCommand with "Input.dispatchKeyEvent" "keydown" commands
      // Could not find a good alternative for Firefox yet, that works with Salesforce's horribly complex input fields
      return;
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
    const [cH, cM, cS, cMs] = [d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()];

    const curTime = cH * 60 * 60 * 1000 + cM * 60 * 1000 + cS * 1000 + cMs;
    const newTime = h * 60 * 60 * 1000 + m * 60 * 1000 + s * 1000 + ms;

    return d.getTime() + (newTime - curTime) + (newTime <= curTime ? 24 * 60 * 60 * 1000 : 0);
  };
  const getTimeTillNextTime = (h = 0, m = 0, s = 0, ms = 0) => getNextTime(h, m, s, ms) - Date.now();

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
});
