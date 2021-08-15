import { sendMessage, get, set } from "./core.js";
import { waitForSelector, waitForTrue } from "./wait-for-it.js";
import { coordsDialog } from "./osm-coords.js";

const css = (css) => {
  const style = document.createElement("style");
  style.innerHTML = css;
  document.head.appendChild(style);
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

const fab = (icon, text, callback) => {
  const button = document.createElement("button");
  button.style.position = "fixed";
  button.style.right = "20px";
  button.style.bottom = "20px";
  button.style.width = "80px";
  button.style.height = "80px";
  button.style.zIndex = 1337;
  button.style.borderRadius = "100%";
  button.innerText = text;
  button.addEventListener("click", callback);
  document.body.appendChild(button);
};

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
};
