const sendMessage = (fun, args = undefined) =>
  new Promise((resolve) => {
    const message = { fun };
    if (typeof args !== "undefined") message.args = args;
    chrome.runtime.sendMessage(message, resolve);
  });

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
  console.log(url, text);
  await set(url, text);
  return text;
};

export { set, get, sendMessage, pathRelative, fetchCached };
