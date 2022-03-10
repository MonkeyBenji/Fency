import { sendMessage, get, set, sleep, getFaSvg } from "./core.js";
import { waitForSelector, waitForTrue } from "./wait-for-it.js";
import { coordsDialog } from "./osm-coords.js";
import { fab } from "./fab.js";
import { onLocationChange } from "./on-location-change.js";
import { select } from "./select.js";

const css = (css, parent = null) => {
  const style = document.createElement("style");
  style.innerHTML = css;
  (parent ?? document.head).appendChild(style);
};

const js = (js) => {
  if (typeof js === "function") js = `(${js})()`;
  const script = document.createElement("script");
  script.innerHTML = js;
  document.head.appendChild(script);
};

const loadScript = (uri) =>
  new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.onload = resolve;
    script.onerror = reject;
    script.src = uri;
    document.head.appendChild(script);
  });

const createElement = (html) => {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template.content.firstElementChild.cloneNode(true);
};

const onLoad = (callback) => {
  if (document.readyState !== "loading") callback();
  else document.addEventListener("DOMContentLoaded", callback);
};

const close = () => sendMessage("closeTab");

const replaceDomStrings = (mapping, domElement = null) => {
  domElement = domElement ?? document.body;
  if (domElement instanceof Text) {
    // Replace texts
    for (const search in mapping) {
      if (domElement.textContent.includes(search))
        domElement.textContent = domElement.textContent.replaceAll(
          search,
          mapping[search]
        );
    }
  } else {
    for (const search in mapping) {
      if (domElement.textContent.includes(search))
        for (const child of domElement.childNodes) {
          replaceDomStrings(mapping, child);
        }
    }
  }
};

const type = (text) => sendMessage("type", { text });

const menuCallbacks = [];
const menu = async (title, callback) => {
  const idx = await sendMessage("menu", { title });
  if (idx === 0) {
    chrome.runtime.onMessage.addListener(({ fun, args }) => {
      if (fun === "menu") {
        menuCallbacks[args.index]();
      }
    });
  }
  menuCallbacks[idx] = callback;
};

const fetchData = async (resource, init = undefined) =>
  await sendMessage("fetchData", { resource, init });

const fetchText = async (resource, init = undefined) =>
  await sendMessage("fetchText", { resource, init });

const fetchJson = async (resource, init = undefined) =>
  await sendMessage("fetchJson", { resource, init });

const lib = async (name) =>
  await import(chrome.runtime.getURL(`/lib/external/${name}.js`));

const save = (blob, filename) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  document.body.removeChild(a);
};

const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];

const info = (...args) =>
  console.info(
    `%c ℹ️ %c ${args.shift()}`,
    "color: #fff; background-color: #4299E1; border-radius: 100%;",
    `color: #2B6494`,
    ...args
  );

export {
  set,
  get,
  css,
  js,
  loadScript,
  onLoad,
  sleep,
  waitForSelector,
  waitForTrue,
  close,
  replaceDomStrings,
  createElement,
  coordsDialog,
  sendMessage,
  type,
  fab,
  fetchData,
  fetchText,
  fetchJson,
  onLocationChange,
  select,
  menu,
  sample,
  lib,
  save,
  info,
  getFaSvg,
};
