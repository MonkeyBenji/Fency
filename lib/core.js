const sendMessage = (fun, args = undefined) =>
  new Promise((resolve) => {
    const message = { fun };
    if (typeof args !== "undefined") message.args = args;
    chrome.runtime.sendMessage(message, resolve);
  });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const set = (key, value) =>
  new Promise((resolve, reject) =>
    chrome.storage.local.set({ [key]: value }, () => resolve())
  );

const get = (key, defaultValue) =>
  new Promise((resolve, reject) =>
    chrome.storage.local.get([key], (result) =>
      resolve(result[key] ?? defaultValue)
    )
  );

const pathRelative = (oldPath, newPath) =>
  oldPath.split("/").slice(0, -1).join("/") + "/" + newPath;

const fetchCached = async (url, json = false, ignoreCache = false) => {
  if (url.startsWith("chrome-extension://")) ignoreCache = true;
  const init = { method: "GET" };
  if (!ignoreCache) {
    const cached = await get(url);
    if (cached) return cached;
  } else {
    init.headers = { cache: "reload" };
  }
  const text = await fetch(url).then((response) =>
    json ? response.json() : response.text()
  );
  await set(url, text);
  return text;
};

const getFaSvg = async (icon) => {
  const response = await fetch(chrome.runtime.getURL(`/icons/fa/${icon}.svg`));
  const content = await response.text();
  return content.replaceAll("<path d", '<path fill="currentColor" d');
};

export { sendMessage, sleep, set, get, pathRelative, fetchCached, getFaSvg };
